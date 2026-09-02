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
