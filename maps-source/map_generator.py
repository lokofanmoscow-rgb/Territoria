"""
Procedural province-map generator for the territory-conquest game.

Generates organic-looking "continent" maps divided into provinces using a
Voronoi diagram + Lloyd relaxation (the same family of technique used by
many strategy-game map generators). Each map is exported as:
  - data/<name>.json   -> provinces (id, polygon points, svg path, centroid,
                           neighbors, regionId), region list, boundary
  - assets/<name>.svg  -> plain outline SVG (fill set at runtime in-app)
  - previews/<name>.png-> colored preview (by region) for visual review

Usage: python3 map_generator.py
"""
import json
import math
import random
from pathlib import Path

import numpy as np
from scipy.spatial import Voronoi
from shapely.geometry import Polygon, Point
from shapely.ops import unary_union
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import Polygon as MplPolygon
from matplotlib.collections import PatchCollection

VIEWBOX_W, VIEWBOX_H = 1000, 700
CENTER = (VIEWBOX_W / 2, VIEWBOX_H / 2)

PALETTE = [
    "#e07a5f", "#3d5a80", "#81b29a", "#f2cc8f", "#9b5de5",
    "#00bbf9", "#ef476f", "#06d6a0", "#ffd166", "#118ab2",
]


def make_blob_boundary(center, base_radius, seed, n_points=72, harmonics=6, wobble=0.30, margin=20):
    """Smooth irregular 'coastline' polygon via a random low-frequency Fourier wobble.

    The per-harmonic amplitudes are normalized so their sum equals `wobble`,
    which guarantees radius never exceeds base_radius * (1 + wobble) even in
    the worst-case alignment of all harmonics — keeps the shape predictably
    inside the canvas. A final hard clip to a safe margin box is a defensive
    backstop against any remaining edge case.
    """
    rng = random.Random(seed)
    raw = [rng.uniform(0.5, 1.0) / (i + 1) for i in range(harmonics)]
    scale = wobble / sum(raw)
    amp = [a * scale for a in raw]
    phase = [rng.uniform(0, 2 * math.pi) for _ in range(harmonics)]
    pts = []
    for k in range(n_points):
        theta = 2 * math.pi * k / n_points
        r = base_radius
        for i in range(harmonics):
            r += base_radius * amp[i] * math.sin((i + 2) * theta + phase[i])
        x = center[0] + r * math.cos(theta)
        y = center[1] + r * math.sin(theta)
        pts.append((x, y))
    poly = Polygon(pts)
    if not poly.is_valid:
        poly = poly.buffer(0)
    safe_box = Polygon([
        (margin, margin), (VIEWBOX_W - margin, margin),
        (VIEWBOX_W - margin, VIEWBOX_H - margin), (margin, VIEWBOX_H - margin),
    ])
    poly = poly.intersection(safe_box)
    if poly.geom_type == "MultiPolygon":
        poly = max(poly.geoms, key=lambda g: g.area)
    return poly


def sample_points_in_polygon(poly, n, seed, inset_ratio=0.06):
    rng = np.random.default_rng(seed)
    minx, miny, maxx, maxy = poly.bounds
    shrink = poly.buffer(-inset_ratio * min(maxx - minx, maxy - miny))
    target = shrink if shrink.area > poly.area * 0.3 else poly
    pts = []
    tries = 0
    while len(pts) < n and tries < n * 200:
        x = rng.uniform(minx, maxx)
        y = rng.uniform(miny, maxy)
        tries += 1
        if target.contains(Point(x, y)):
            pts.append((x, y))
    return np.array(pts)


def voronoi_regions(points, bbox):
    minx, miny, maxx, maxy = bbox
    diag = math.hypot(maxx - minx, maxy - miny)
    far = diag * 10
    dummy = [
        (minx - far, miny - far), (maxx + far, miny - far),
        (minx - far, maxy + far), (maxx + far, maxy + far),
        ((minx + maxx) / 2, miny - far), ((minx + maxx) / 2, maxy + far),
        (minx - far, (miny + maxy) / 2), (maxx + far, (miny + maxy) / 2),
    ]
    all_points = np.vstack([points, np.array(dummy)])
    vor = Voronoi(all_points)
    polys = {}
    for i in range(len(points)):
        region_index = vor.point_region[i]
        region = vor.regions[region_index]
        if -1 in region or len(region) == 0:
            continue
        poly_pts = [vor.vertices[v] for v in region]
        p = Polygon(poly_pts)
        if p.is_valid and p.area > 0:
            polys[i] = p
    return polys, vor


def lloyd_relax(points, landmass, bbox, iterations=3):
    pts = points.copy()
    for _ in range(iterations):
        polys, _ = voronoi_regions(pts, bbox)
        new_pts = pts.copy()
        for i, poly in polys.items():
            clipped = poly.intersection(landmass)
            if not clipped.is_empty and clipped.area > 1e-6:
                c = clipped.centroid
                new_pts[i] = [c.x, c.y]
        pts = new_pts
    return pts


def simple_kmeans(points, k, seed, iters=25):
    rng = np.random.default_rng(seed)
    idx = rng.choice(len(points), size=k, replace=False)
    centers = points[idx].copy()
    labels = np.zeros(len(points), dtype=int)
    for _ in range(iters):
        d = np.linalg.norm(points[:, None, :] - centers[None, :, :], axis=2)
        labels = d.argmin(axis=1)
        for c in range(k):
            members = points[labels == c]
            if len(members) > 0:
                centers[c] = members.mean(axis=0)
    return labels


def polygon_to_svg_path(poly: Polygon, decimals=1):
    coords = list(poly.exterior.coords)[:-1]
    parts = [f"M {coords[0][0]:.{decimals}f},{coords[0][1]:.{decimals}f}"]
    for x, y in coords[1:]:
        parts.append(f"L {x:.{decimals}f},{y:.{decimals}f}")
    parts.append("Z")
    return " ".join(parts)


def generate_map(name, size_class, n_provinces, seed, base_radius):
    rng = random.Random(seed + 1)
    jitter = base_radius * 0.15
    center = (CENTER[0] + rng.uniform(-jitter, jitter), CENTER[1] + rng.uniform(-jitter, jitter))
    landmass = make_blob_boundary(center, base_radius, seed)
    bbox = (0, 0, VIEWBOX_W, VIEWBOX_H)

    pts = sample_points_in_polygon(landmass, n_provinces, seed)
    pts = lloyd_relax(pts, landmass, bbox, iterations=3)

    polys, vor = voronoi_regions(pts, bbox)

    clipped = {}
    for i, poly in polys.items():
        c = poly.intersection(landmass)
        if c.is_empty:
            continue
        if c.geom_type == "MultiPolygon":
            c = max(c.geoms, key=lambda g: g.area)
        if c.area > (landmass.area / n_provinces) * 0.08:
            clipped[i] = c

    kept_ids = sorted(clipped.keys())
    id_map = {old: new for new, old in enumerate(kept_ids)}

    neighbor_pairs = set()
    for a, b in vor.ridge_points:
        if a in clipped and b in clipped:
            if clipped[a].touches(clipped[b]) or clipped[a].intersection(clipped[b]).length > 0.01:
                neighbor_pairs.add((id_map[a], id_map[b]))

    neighbors = {i: set() for i in range(len(kept_ids))}
    for a, b in neighbor_pairs:
        neighbors[a].add(b)
        neighbors[b].add(a)

    centroids = np.array([[clipped[old].centroid.x, clipped[old].centroid.y] for old in kept_ids])
    n_regions = max(3, round(len(kept_ids) / 6.5))
    labels = simple_kmeans(centroids, n_regions, seed)

    provinces = []
    for new_id, old_id in enumerate(kept_ids):
        poly = clipped[old_id]
        coords = [[round(x, 1), round(y, 1)] for x, y in list(poly.exterior.coords)[:-1]]
        provinces.append({
            "id": new_id,
            "regionId": int(labels[new_id]),
            "points": coords,
            "svgPath": polygon_to_svg_path(poly),
            "centroid": [round(poly.centroid.x, 1), round(poly.centroid.y, 1)],
            "neighbors": sorted(neighbors[new_id]),
        })

    regions = []
    for r in range(n_regions):
        members = [p["id"] for p in provinces if p["regionId"] == r]
        regions.append({"id": r, "provinceIds": members, "controlBonus": max(1, len(members) // 3)})

    boundary_coords = [[round(x, 1), round(y, 1)] for x, y in list(landmass.exterior.coords)[:-1]]

    data = {
        "name": name,
        "sizeClass": size_class,
        "seed": seed,
        "viewBox": f"0 0 {VIEWBOX_W} {VIEWBOX_H}",
        "provinceCount": len(provinces),
        # массив колец (не одно) — формат общий с картами на реальной географии,
        # где остров может состоять из нескольких колец (архипелаг)
        "boundary": [boundary_coords],
        "provinces": provinces,
        "regions": regions,
    }
    return data


def render_preview(data, path):
    fig, ax = plt.subplots(figsize=(6, 4.2), dpi=150)
    ax.set_xlim(0, VIEWBOX_W)
    ax.set_ylim(0, VIEWBOX_H)
    ax.invert_yaxis()
    ax.axis("off")
    ax.set_facecolor("#dbe9f4")

    patches, colors = [], []
    for p in data["provinces"]:
        patches.append(MplPolygon(p["points"], closed=True))
        colors.append(PALETTE[p["regionId"] % len(PALETTE)])
    coll = PatchCollection(patches, facecolor=colors, edgecolor="#2b2b2b", linewidths=0.7)
    ax.add_collection(coll)

    bx = data["boundary"] + [data["boundary"][0]]
    xs, ys = zip(*bx)
    ax.plot(xs, ys, color="#1b1b1b", linewidth=1.4)

    ax.set_title(f'{data["name"]}  ({data["sizeClass"]}, {data["provinceCount"]} provinces)', fontsize=9)
    fig.tight_layout()
    fig.savefig(path, facecolor="white")
    plt.close(fig)


def main():
    out = Path("/home/claude/maps_output")
    (out / "data").mkdir(parents=True, exist_ok=True)
    (out / "assets").mkdir(parents=True, exist_ok=True)
    (out / "previews").mkdir(parents=True, exist_ok=True)

    plan = []
    for i in range(5):
        plan.append((f"small_{i+1:02d}", "small", random.randint(10, 14), 140))
    for i in range(5):
        plan.append((f"medium_{i+1:02d}", "medium", random.randint(20, 28), 190))
    for i in range(5):
        plan.append((f"large_{i+1:02d}", "large", random.randint(38, 50), 235))

    index = []
    for n, (name, size_class, n_prov, base_radius) in enumerate(plan):
        seed = 1000 + n * 37
        data = generate_map(name, size_class, n_prov, seed, base_radius)

        with open(out / "data" / f"{name}.json", "w") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

        svg_parts = [f'<svg viewBox="{data["viewBox"]}" xmlns="http://www.w3.org/2000/svg">']
        for p in data["provinces"]:
            svg_parts.append(f'<path id="p{p["id"]}" d="{p["svgPath"]}" fill="#cccccc" stroke="#444444" stroke-width="1"/>')
        svg_parts.append("</svg>")
        with open(out / "assets" / f"{name}.svg", "w") as f:
            f.write("\n".join(svg_parts))

        render_preview(data, out / "previews" / f"{name}.png")
        index.append({"name": name, "sizeClass": size_class, "provinceCount": data["provinceCount"], "regions": len(data["regions"])})
        print(f"{name}: {data['provinceCount']} provinces, {len(data['regions'])} regions")

    with open(out / "index.json", "w") as f:
        json.dump(index, f, ensure_ascii=False, indent=2)


if __name__ == "__main__":
    main()
