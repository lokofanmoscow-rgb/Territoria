export function pointsToPath(points: [number, number][]): string {
  if (points.length === 0) return '';
  const [first, ...rest] = points;
  const segments = rest.map(([x, y]) => `L ${x} ${y}`).join(' ');
  return `M ${first[0]} ${first[1]} ${segments} Z`;
}

export function parseViewBox(viewBox: string): { x: number; y: number; width: number; height: number } {
  const [x, y, width, height] = viewBox.split(' ').map(Number);
  return { x, y, width, height };
}

function distancePointToSegment(
  p: [number, number],
  a: [number, number],
  b: [number, number],
): number {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const lengthSquared = dx * dx + dy * dy;
  const t = lengthSquared === 0 ? 0 : Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / lengthSquared));
  const closestX = a[0] + t * dx;
  const closestY = a[1] + t * dy;
  return Math.hypot(p[0] - closestX, p[1] - closestY);
}

// Voronoi-ячейки всегда выпуклые, поэтому круг вокруг centroid радиусом до
// ближайшего ребра гарантированно целиком лежит внутри провинции — по нему
// безопасно разбрасывать значки рельефа, не вылезая за границу.
export function inscribedRadius(points: [number, number][], centroid: [number, number]): number {
  let min = Infinity;
  for (let i = 0; i < points.length; i++) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    min = Math.min(min, distancePointToSegment(centroid, a, b));
  }
  return Number.isFinite(min) ? min : 20;
}
