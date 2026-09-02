// Конвертер admin1-границ (Natural Earth, через apexmaps-geo) в наш формат
// карты (src/types/map.ts MapData). Одноразовый скрипт, не часть приложения.
const fs = require('fs');
const path = require('path');
const topojsonClient = require('topojson-client');
const topojsonSimplify = require('topojson-simplify');

const OUT_DIR = '/home/user/territoria/src/assets/maps/data';

const MAPS = [
  { key: 'australia', file: 'au-admin1-10m.json', quantile: 0.005, sizeClass: 'small', nameField: 'name' },
  { key: 'brazil', file: 'br-admin1-10m.json', quantile: 0.005, sizeClass: 'medium', nameField: 'name' },
  // 0.01 убивало Окинаву (архипелаг из мелких островов, у каждого локально
  // низкий "вес" при глобальном упрощении) до неразличимого пятна — 0.05
  // сохраняет её, ценой чуть большей детализации остальных префектур.
  { key: 'japan', file: 'jp-admin1-10m.json', quantile: 0.05, sizeClass: 'large', nameField: 'name' },
];

const VIEWBOX_W = 1000;
const VIEWBOX_H = 700;
const MARGIN = 30;

function polygonAreaAndCentroid(ring) {
  let area = 0;
  let cx = 0;
  let cy = 0;
  const n = ring.length;
  for (let i = 0; i < n; i++) {
    const [x0, y0] = ring[i];
    const [x1, y1] = ring[(i + 1) % n];
    const cross = x0 * y1 - x1 * y0;
    area += cross;
    cx += (x0 + x1) * cross;
    cy += (y0 + y1) * cross;
  }
  area *= 0.5;
  if (Math.abs(area) < 1e-9) {
    const avgX = ring.reduce((s, p) => s + p[0], 0) / n;
    const avgY = ring.reduce((s, p) => s + p[1], 0) / n;
    return { area: 0, centroid: [avgX, avgY] };
  }
  return { area: Math.abs(area), centroid: [cx / (6 * area), cy / (6 * area)] };
}

function kmeans(points, k) {
  const sortedIdx = points.map((_, i) => i).sort((a, b) => points[a][0] - points[b][0]);
  const step = points.length / k;
  const centers = [];
  for (let c = 0; c < k; c++) centers.push([...points[sortedIdx[Math.floor(c * step)]]]);

  let labels = new Array(points.length).fill(0);
  for (let iter = 0; iter < 25; iter++) {
    labels = points.map((p) => {
      let best = 0;
      let bestDist = Infinity;
      centers.forEach((c, ci) => {
        const d = (p[0] - c[0]) ** 2 + (p[1] - c[1]) ** 2;
        if (d < bestDist) {
          bestDist = d;
          best = ci;
        }
      });
      return best;
    });
    const sums = centers.map(() => [0, 0, 0]);
    points.forEach((p, i) => {
      const l = labels[i];
      sums[l][0] += p[0];
      sums[l][1] += p[1];
      sums[l][2] += 1;
    });
    sums.forEach((s, ci) => {
      if (s[2] > 0) centers[ci] = [s[0] / s[2], s[1] / s[2]];
    });
  }
  return labels;
}

function round1(n) {
  return Math.round(n * 10) / 10;
}

function ringToSvgPath(ring) {
  const pts = ring.map(([x, y]) => `${round1(x)},${round1(y)}`);
  return `M ${pts[0]} L ${pts.slice(1).join(' L ')} Z`;
}

for (const cfg of MAPS) {
  const raw = JSON.parse(fs.readFileSync(path.join(__dirname, 'node_modules/apexmaps-geo', cfg.file), 'utf8'));
  const objectName = Object.keys(raw.objects)[0];

  const presimplified = topojsonSimplify.presimplify(raw, topojsonSimplify.sphericalTriangleArea);
  const minWeight = topojsonSimplify.quantile(presimplified, cfg.quantile);
  const simplified = topojsonSimplify.simplify(presimplified, minWeight);

  const geometries = simplified.objects[objectName].geometries;
  const neighborIndices = topojsonClient.neighbors(geometries);
  const featureCollection = topojsonClient.feature(simplified, simplified.objects[objectName]);
  featureCollection.features.forEach((f) => {
    f.properties.__name = f.properties[cfg.nameField] || '?';
  });
  const mergedBoundary = topojsonClient.merge(simplified, geometries);

  // --- проекция: equirectangular + коррекция по cos(средней широты), с
  // отступом от края viewBox, единая для провинций и контура страны ---
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  const visit = (coords, depth) => {
    if (depth === 1) {
      for (const [x, y] of coords) {
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
      }
    } else {
      for (const c of coords) visit(c, depth - 1);
    }
  };
  for (const f of featureCollection.features) {
    visit(f.geometry.coordinates, f.geometry.type === 'Polygon' ? 2 : 3);
  }

  const latMid = (minY + maxY) / 2;
  const aspect = Math.cos((latMid * Math.PI) / 180);
  const spanX = (maxX - minX) * aspect;
  const spanY = maxY - minY;
  const scale = Math.min((VIEWBOX_W - 2 * MARGIN) / spanX, (VIEWBOX_H - 2 * MARGIN) / spanY);
  const offsetX = (VIEWBOX_W - spanX * scale) / 2;
  const offsetY = (VIEWBOX_H - spanY * scale) / 2;

  const project = ([lng, lat]) => [
    (lng - minX) * aspect * scale + offsetX,
    (maxY - lat) * scale + offsetY,
  ];

  // --- провинции: берём самый крупный полигон (если MultiPolygon — редкие
  // мелкие острова провинции отбрасываем, как и в процедурном генераторе,
  // там тоже всегда один простой полигон на провинцию) ---
  const candidates = featureCollection.features.map((f, rawId) => {
    const rawPolys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
    let bestRing = null;
    let bestArea = -1;
    for (const poly of rawPolys) {
      const projected = poly[0].map(project);
      const { area } = polygonAreaAndCentroid(projected);
      if (area > bestArea) {
        bestArea = area;
        bestRing = projected;
      }
    }
    return { rawId, name: f.properties.__name, ring: bestRing, area: bestArea };
  });

  // Natural Earth admin1 включает отдельными "провинциями" совсем крохотные
  // удалённые территории (Macquarie Island, Lord Howe Island...) — на нашем
  // масштабе они схлопываются в точку в открытом море, а бейдж войск всё
  // равно рисуется там же. Реального игрового смысла в них нет — отбрасываем
  // по площади относительно самой крупной провинции карты.
  const maxArea = Math.max(...candidates.map((c) => c.area));
  const kept = candidates.filter((c) => c.area >= maxArea * 0.01);
  const droppedNames = candidates.filter((c) => c.area < maxArea * 0.01).map((c) => c.name);
  if (droppedNames.length > 0) {
    console.log(`  ${cfg.key}: dropped tiny territories — ${droppedNames.join(', ')}`);
  }

  const oldToNew = new Map(kept.map((c, newId) => [c.rawId, newId]));

  const provinces = kept.map((c, id) => {
    const { centroid } = polygonAreaAndCentroid(c.ring);
    const points = c.ring.map(([x, y]) => [round1(x), round1(y)]);
    const neighbors = [...neighborIndices[c.rawId]]
      .filter((n) => oldToNew.has(n))
      .map((n) => oldToNew.get(n))
      .sort((a, b) => a - b);
    return {
      id,
      name: c.name,
      points,
      svgPath: ringToSvgPath(points),
      centroid: [round1(centroid[0]), round1(centroid[1])],
      neighbors,
    };
  });

  const nRegions = Math.max(3, Math.round(provinces.length / 6.5));
  const labels = kmeans(
    provinces.map((p) => p.centroid),
    nRegions,
  );
  provinces.forEach((p, i) => {
    p.regionId = labels[i];
  });

  const regions = [];
  for (let r = 0; r < nRegions; r++) {
    const members = provinces.filter((p) => p.regionId === r).map((p) => p.id);
    if (members.length === 0) continue;
    regions.push({ id: r, provinceIds: members, controlBonus: Math.max(1, Math.floor(members.length / 3)) });
  }

  // --- контур страны: несколько колец (архипелаг), отбрасываем совсем
  // мелкие острова — иначе в контуре окажутся сотни точечных скал ---
  const rawBoundaryPolys =
    mergedBoundary.type === 'Polygon' ? [mergedBoundary.coordinates] : mergedBoundary.coordinates;
  const boundaryRings = rawBoundaryPolys
    .map((poly) => poly[0].map(project))
    .map((ring) => ({ ring, area: polygonAreaAndCentroid(ring).area }))
    .sort((a, b) => b.area - a.area);
  const totalArea = boundaryRings.reduce((s, r) => s + r.area, 0);
  const keptRings = boundaryRings
    .filter((r) => r.area >= totalArea * 0.003)
    .map((r) => r.ring.map(([x, y]) => [round1(x), round1(y)]));

  const data = {
    name: cfg.key,
    sizeClass: cfg.sizeClass,
    source: 'Natural Earth 5.1.1 admin-1 boundaries (public domain), via apexmaps-geo npm package',
    viewBox: `0 0 ${VIEWBOX_W} ${VIEWBOX_H}`,
    provinceCount: provinces.length,
    boundary: keptRings,
    provinces: provinces.map(({ name, ...rest }) => rest), // name — только для справки при отладке, в схему не входит
    regions,
  };

  fs.writeFileSync(path.join(OUT_DIR, `${cfg.key}.json`), JSON.stringify(data));
  console.log(
    `${cfg.key}: ${provinces.length} provinces, ${regions.length} regions, ${keptRings.length} boundary rings (of ${boundaryRings.length})`,
  );
}
