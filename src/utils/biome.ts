import type { MapData, ProvinceStatic } from '../types/map';

// Провинция красится не "по владельцу" (это отдельный слой поверх), а как
// настоящий ландшафт — цвет зависит от широты (centroid.y относительно
// высоты viewBox), как климатические пояса на карте мира: от тундры на
// севере через лес и равнины к пустыне на юге. Внутри пояса берётся один
// из нескольких оттенков — детерминированно по id провинции, чтобы соседние
// клетки не сливались в одно пятно, но каждый повторный рендер давал тот же
// результат.

export type BiomeId = 'tundra' | 'taiga' | 'forest' | 'grassland' | 'hills' | 'desert';

interface BiomeBand {
  id: BiomeId;
  label: string;
  maxLatitude: number;
  colors: string[];
}

const BANDS: BiomeBand[] = [
  { id: 'tundra', label: 'Тундра', maxLatitude: 0.15, colors: ['#cfd9d6', '#c3d0cd', '#d8e2df'] },
  { id: 'taiga', label: 'Тайга', maxLatitude: 0.32, colors: ['#5c7a5e', '#6a8768', '#4f6f55'] },
  { id: 'forest', label: 'Лес', maxLatitude: 0.5, colors: ['#3f7a43', '#4a8a4e', '#357238'] },
  { id: 'grassland', label: 'Равнины', maxLatitude: 0.68, colors: ['#8bab4f', '#99b85c', '#7ea345'] },
  { id: 'hills', label: 'Холмы', maxLatitude: 0.85, colors: ['#b79a52', '#c2a85e', '#ab8f47'] },
  { id: 'desert', label: 'Пустыня', maxLatitude: Infinity, colors: ['#dcc07a', '#e2c884', '#d3b56e'] },
];

// Простой детерминированный хэш (Knuth multiplicative), только для выбора
// оттенка — не нужна крипто-стойкость, только стабильность и разброс.
function hash(n: number): number {
  const h = Math.imul(n + 1, 2654435761);
  return (h ^ (h >>> 13)) >>> 0;
}

function viewBoxHeight(viewBox: string): number {
  const parts = viewBox.split(' ').map(Number);
  return parts[3] || 700;
}

export interface Biome {
  id: BiomeId;
  label: string;
  color: string;
}

export function getBiome(province: ProvinceStatic, map: Pick<MapData, 'viewBox'>): Biome {
  const height = viewBoxHeight(map.viewBox);
  const latitude = province.centroid[1] / height;
  const band = BANDS.find((b) => latitude <= b.maxLatitude) ?? BANDS[BANDS.length - 1];
  const color = band.colors[hash(province.id) % band.colors.length];
  return { id: band.id, label: band.label, color };
}
