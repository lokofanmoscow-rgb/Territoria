"""
Мульти-страновая карта: реальные контуры стран (Natural Earth, через
apexmaps-geo/world-countries-50m.json, экспортированы в countries-<key>.json
Node-скриптом export-countries.js), внутри каждой страны — процедурное
Voronoi-деление на небольшое (управляемое) число провинций, а не настоящие
административные границы. Один общий Voronoi-диаграм по всем странам сразу,
чтобы соседство считалось честно и через границы стран тоже.
"""
import json
import math
from pathlib import Path

import numpy as np
from scipy.spatial import Voronoi
from shapely.geometry import Polygon, MultiPolygon, Point
from shapely.ops import unary_union

VIEWBOX_W, VIEWBOX_H = 1000, 700
MARGIN = 30

# Насколько далеко (в градусах, грубая евклидова оценка по lon/lat — для
# отсева достаточно) остров может быть от главного массива той же страны и
# всё ещё считаться "тем же куском карты". Заморские территории (Французская
# Гвиана, Реюньон...) в разы дальше этого порога — реальные близкие
# архипелаги (Британия+Ирландия, острова Японии) в разы ближе.
MAX_ISLAND_DIST_DEG = 15

PROVINCES_PER_COUNTRY = {
    "France": 5, "Spain": 4, "Portugal": 3,
    "Italy": 5, "Germany": 5, "Switzerland": 3,
    "Austria": 3, "Belgium": 3, "Netherlands": 3,
    "United Kingdom": 5, "Poland": 4,
}

PALETTE_SEED = {"small": 2000, "medium": 3000, "large": 4000}


def load_countries(key):
    with open(f"countries-{key}.json") as f:
        return json.load(f)


def to_shapely(geometry):
    if geometry["type"] == "Polygon":
        return Polygon(geometry["coordinates"][0])
    return MultiPolygon([Polygon(ring[0]) for ring in geometry["coordinates"]])


def kept_islands(geom, min_ratio=0.02, max_dist=MAX_ISLAND_DIST_DEG):
    """MultiPolygon -> список полигонов-островов, которые (а) не мельче
    min_ratio от площади самого крупного острова страны и (б) не дальше
    max_dist от его центра — иначе далёкие заморские территории растягивают
    проекцию через полглобуса вместо компактной карты региона."""
    polys = list(geom.geoms) if isinstance(geom, MultiPolygon) else [geom]
    main = max(polys, key=lambda p: p.area)
    max_area = main.area
    main_centroid = main.centroid
    return [
        p for p in polys
        if p.area >= max_area * min_ratio and p.centroid.distance(main_centroid) <= max_dist
    ]


def sample_points_weighted(islands, n, rng):
    """Точки внутри набора островов, число на остров пропорционально площади,
    минимум 1 на остров (иначе крупный отдельный остров рискует остаться без
    провинции вообще)."""
    total_area = sum(p.area for p in islands)
    counts = [max(1, round(n * p.area / total_area)) for p in islands]
    while sum(counts) > n and max(counts) > 1:
        counts[counts.index(max(counts))] -= 1
    while sum(counts) < n:
        counts[counts.index(max(counts))] += 1

    pts = []
    for poly, count in zip(islands, counts):
        minx, miny, maxx, maxy = poly.bounds
        tries = 0
        got = 0
        while got < count and tries < count * 300:
            x = rng.uniform(minx, maxx)
            y = rng.uniform(miny, maxy)
            tries += 1
            if poly.contains(Point(x, y)):
                pts.append((x, y))
                got += 1
        if got < count:
            c = poly.representative_point()
            for _ in range(count - got):
                pts.append((c.x, c.y))
    return pts


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


def lloyd_relax(points, owner_landmass, bbox, iterations=3):
    pts = points.copy()
    for _ in range(iterations):
        polys, _ = voronoi_regions(pts, bbox)
        new_pts = pts.copy()
        for i, poly in polys.items():
            clipped = poly.intersection(owner_landmass[i])
            if not clipped.is_empty and clipped.area > 1e-9:
                c = clipped.centroid
                new_pts[i] = [c.x, c.y]
        pts = new_pts
    return pts


def polygon_to_svg_path(poly, decimals=1):
    coords = list(poly.exterior.coords)[:-1]
    parts = [f"M {coords[0][0]:.{decimals}f},{coords[0][1]:.{decimals}f}"]
    for x, y in coords[1:]:
        parts.append(f"L {x:.{decimals}f},{y:.{decimals}f}")
    parts.append("Z")
    return " ".join(parts)


def build(key):
    countries = load_countries(key)
    rng = np.random.default_rng(PALETTE_SEED[key])

    # --- острова каждой страны в lon/lat, отфильтрованные ДО расчёта
    # bbox/проекции — иначе одна далёкая заморская территория растягивает
    # проекцию на всю карту (ровно это и произошло с Французской Гвианой) ---
    country_islands_lonlat = []
    for c in countries:
        geom = to_shapely(c["geometry"])
        country_islands_lonlat.append(kept_islands(geom))

    # --- проекция: bbox только по оставленным островам ---
    all_lngs = [x for islands in country_islands_lonlat for p in islands for x, y in p.exterior.coords]
    all_lats = [y for islands in country_islands_lonlat for p in islands for x, y in p.exterior.coords]

    min_lng, max_lng = min(all_lngs), max(all_lngs)
    min_lat, max_lat = min(all_lats), max(all_lats)
    lat_mid = (min_lat + max_lat) / 2
    aspect = math.cos(math.radians(lat_mid))
    span_x = (max_lng - min_lng) * aspect
    span_y = max_lat - min_lat
    scale = min((VIEWBOX_W - 2 * MARGIN) / span_x, (VIEWBOX_H - 2 * MARGIN) / span_y)
    offset_x = (VIEWBOX_W - span_x * scale) / 2
    offset_y = (VIEWBOX_H - span_y * scale) / 2

    def project(lng, lat):
        x = (lng - min_lng) * aspect * scale + offset_x
        y = (max_lat - lat) * scale + offset_y
        return (x, y)

    def project_poly(poly):
        return Polygon([project(x, y) for x, y in poly.exterior.coords])

    country_islands = [[project_poly(p) for p in islands] for islands in country_islands_lonlat]

    # --- точки: пропорционально площади острова внутри страны ---
    all_points = []
    point_country = []
    point_landmass = []  # geometry страны (объединение её keep-островов) для Lloyd relax
    for ci, islands in enumerate(country_islands):
        name = countries[ci]["name"]
        n = PROVINCES_PER_COUNTRY.get(name, 4)
        pts = sample_points_weighted(islands, n, rng)
        landmass = unary_union(islands)
        for p in pts:
            all_points.append(p)
            point_country.append(ci)
            point_landmass.append(landmass)

    points = np.array(all_points)
    bbox = (0, 0, VIEWBOX_W, VIEWBOX_H)
    points = lloyd_relax(points, point_landmass, bbox, iterations=3)

    polys, vor = voronoi_regions(points, bbox)

    clipped = {}
    for i, poly in polys.items():
        c = poly.intersection(point_landmass[i])
        if c.is_empty:
            continue
        if c.geom_type == "MultiPolygon":
            c = max(c.geoms, key=lambda g: g.area)
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

    provinces = []
    for new_id, old_id in enumerate(kept_ids):
        poly = clipped[old_id]
        coords = [[round(x, 1), round(y, 1)] for x, y in list(poly.exterior.coords)[:-1]]
        provinces.append({
            "id": new_id,
            "regionId": point_country[old_id],
            "points": coords,
            "svgPath": polygon_to_svg_path(poly),
            "centroid": [round(poly.centroid.x, 1), round(poly.centroid.y, 1)],
            "neighbors": sorted(neighbors[new_id]),
        })

    regions = []
    for ci, c in enumerate(countries):
        members = [p["id"] for p in provinces if p["regionId"] == ci]
        if not members:
            continue
        regions.append({"id": ci, "provinceIds": members, "controlBonus": max(1, len(members) // 2)})

    boundary_rings = []
    for islands in country_islands:
        for poly in islands:
            boundary_rings.append([[round(x, 1), round(y, 1)] for x, y in list(poly.exterior.coords)[:-1]])

    data = {
        "name": key,
        "sizeClass": key,
        "source": "Natural Earth 5.1.1 country boundaries (public domain, via apexmaps-geo) "
                  "+ procedural Voronoi province split (own generator, seed below)",
        "seed": PALETTE_SEED[key],
        "viewBox": f"0 0 {VIEWBOX_W} {VIEWBOX_H}",
        "provinceCount": len(provinces),
        "boundary": boundary_rings,
        "provinces": provinces,
        "regions": regions,
    }
    return data, [c["name"] for c in countries]


if __name__ == "__main__":
    out_dir = Path("/home/user/territoria/src/assets/maps/data")
    for key in ["small", "medium", "large"]:
        data, names = build(key)
        with open(out_dir / f"world_{key}.json", "w") as f:
            json.dump(data, f, ensure_ascii=False)
        print(f"world_{key}: {data['provinceCount']} provinces, {len(data['regions'])} countries "
              f"({', '.join(names)})")
