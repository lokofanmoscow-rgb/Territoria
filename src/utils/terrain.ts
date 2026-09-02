import type { ProvinceStatic } from '../types/map';
import type { BiomeId } from './biome';
import { inscribedRadius } from './geometry';
import { hash } from './random';

export type ReliefType = 'forest' | 'mountains' | 'hills' | 'dunes' | 'grass' | 'none';

export interface ReliefGlyph {
  type: ReliefType;
  x: number;
  y: number;
  size: number;
  rotation: number;
}

// Горы/холмы могут пересекать климатические пояса (как в реальной
// географии — хребет не спрашивает, тундра под ним или лес), поэтому тип
// рельефа выбирается отдельным броском по каждому биому, а не совпадает с
// самим биомом один-в-один.
const RELIEF_TABLE: Record<BiomeId, { type: ReliefType; weight: number }[]> = {
  tundra: [
    { type: 'none', weight: 35 },
    { type: 'hills', weight: 25 },
    { type: 'mountains', weight: 40 },
  ],
  taiga: [
    { type: 'forest', weight: 55 },
    { type: 'hills', weight: 15 },
    { type: 'mountains', weight: 30 },
  ],
  forest: [
    { type: 'forest', weight: 65 },
    { type: 'hills', weight: 15 },
    { type: 'mountains', weight: 15 },
    { type: 'none', weight: 5 },
  ],
  grassland: [
    { type: 'none', weight: 25 },
    { type: 'grass', weight: 25 },
    { type: 'forest', weight: 15 },
    { type: 'hills', weight: 20 },
    { type: 'mountains', weight: 15 },
  ],
  hills: [
    { type: 'hills', weight: 35 },
    { type: 'mountains', weight: 40 },
    { type: 'forest', weight: 25 },
  ],
  desert: [
    { type: 'dunes', weight: 55 },
    { type: 'none', weight: 15 },
    { type: 'hills', weight: 15 },
    { type: 'mountains', weight: 15 },
  ],
};

// Горы — плотным кластером (гряда, не одинокий пик), поэтому диапазон
// заметно шире остальных типов.
const GLYPH_COUNT: Record<ReliefType, [number, number]> = {
  forest: [3, 5],
  mountains: [3, 6],
  hills: [2, 4],
  dunes: [2, 3],
  grass: [3, 4],
  none: [0, 0],
};

// Деревья/горы/траву поворачивать нельзя (выглядят перевёрнуто), а холмам и
// дюнам небольшой наклон только добавляет естественности.
const ROTATABLE: ReliefType[] = ['hills', 'dunes'];

function pickReliefType(biomeId: BiomeId, provinceId: number): ReliefType {
  const table = RELIEF_TABLE[biomeId];
  const total = table.reduce((sum, entry) => sum + entry.weight, 0);
  let roll = hash(provinceId * 13 + 7) % total;
  for (const entry of table) {
    if (roll < entry.weight) return entry.type;
    roll -= entry.weight;
  }
  return table[table.length - 1].type;
}

export function getReliefGlyphs(province: ProvinceStatic, biomeId: BiomeId): ReliefGlyph[] {
  const type = pickReliefType(biomeId, province.id);
  const [min, max] = GLYPH_COUNT[type];
  if (max === 0) return [];

  const count = min + (hash(province.id * 31 + 3) % (max - min + 1));
  const radius = inscribedRadius(province.points, province.centroid);
  const placementRadius = radius * 0.6;
  // Горы рисуются крупнее остального рельефа — гряда должна быть видна
  // издалека, а не теряться среди деревьев и холмов.
  const sizeCap = type === 'mountains' ? 15 : 10;
  const size = Math.max(4, Math.min(sizeCap, radius * (type === 'mountains' ? 0.3 : 0.24)));
  const baseAngle = ((hash(province.id * 53 + 11) % 360) * Math.PI) / 180;

  const glyphs: ReliefGlyph[] = [];
  for (let i = 0; i < count; i++) {
    const angle = baseAngle + (i / count) * Math.PI * 2;
    const jitter = 0.7 + (hash(province.id * 97 + i * 17) % 60) / 100;
    const r = placementRadius * jitter;
    const rotation = ROTATABLE.includes(type) ? (hash(province.id * 71 + i * 5) % 40) - 20 : 0;

    glyphs.push({
      type,
      x: province.centroid[0] + Math.cos(angle) * r,
      y: province.centroid[1] + Math.sin(angle) * r,
      size,
      rotation,
    });
  }
  return glyphs;
}
