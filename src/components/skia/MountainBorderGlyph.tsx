import { Group, LinearGradient, Path, vec, type Vector } from '@shopify/react-native-skia';

import type { MountainBorder } from '../../types/map';
import { hash } from '../../utils/random';
import NoiseOverlay from './NoiseOverlay';

interface MountainBorderGlyphProps {
  border: MountainBorder;
}

const OUTLINE = 'rgba(16, 24, 32, 0.55)';

const MOUNTAIN_FRONT: Vector[] = [vec(0, 4), vec(0, -9)];
const MOUNTAIN_FRONT_COLORS = ['#564f45', '#a89c8d'];
const MOUNTAIN_BACK: Vector[] = [vec(0, 4), vec(0, -8)];
const MOUNTAIN_BACK_COLORS = ['rgba(139, 149, 161, 0.55)', 'rgba(195, 204, 211, 0.55)'];

const MIN_SIZE = 8;
const MAX_SIZE = 20;
const LENGTH_TO_SIZE = 0.18;

// Хребет ставится РОВНО на общую границу двух провинций (border.x/y — точка
// на самой границе, не centroid ни одной из них) и развёрнут вдоль её
// направления (border.angle) — читается как физический барьер между ними,
// а не декорация внутри чьей-то территории. Соответствующая пара граничащих
// провинций исключена из целей атаки — см. gameLogic.ts pairKey/isBlockedPair
// и GameScreen.tsx.
export default function MountainBorderGlyph({ border }: MountainBorderGlyphProps) {
  const size = Math.max(MIN_SIZE, Math.min(MAX_SIZE, border.length * LENGTH_TO_SIZE));
  const scale = size / 5;
  // Разный сдвиг шума на каждый хребет, иначе все горы карты показывают одну
  // и ту же скальную фактуру (детерминированно от границы, не от рандома).
  const noiseSeed = hash(border.a * 131 + border.b * 977) % 97;

  return (
    <Group
      transform={[
        { translateX: border.x },
        { translateY: border.y },
        { rotate: (border.angle * Math.PI) / 180 },
        { scale },
      ]}
    >
      {/* тень под хребтом — прижимает его к земле */}
      <Path path="M -9 4.3 A 9 1.5 0 1 0 9 4.3 A 9 1.5 0 1 0 -9 4.3 Z" color="rgba(16, 24, 32, 0.22)" style="fill" />
      {/* дальний план: ниже, светлее, полупрозрачный — воздушная перспектива */}
      <Path path="M -10 4 L -7.5 -3.3 L -5 -0.6 L -2 -6.2 L 1 -1.4 L 4.5 -5.3 L 7.5 -0.4 L 10 4 Z" style="fill">
        <LinearGradient start={MOUNTAIN_BACK[0]} end={MOUNTAIN_BACK[1]} colors={MOUNTAIN_BACK_COLORS} />
      </Path>
      {/* ближний план: собственно хребет, освещён сверху (градиент) + живая скальная фактура шумом */}
      <Path path="M -9 4 L -6.5 -2 L -4 1 L -1 -8 L 2 -1 L 5.5 -9 L 8.5 0 L 9 4 Z" style="fill">
        <LinearGradient start={MOUNTAIN_FRONT[0]} end={MOUNTAIN_FRONT[1]} colors={MOUNTAIN_FRONT_COLORS} />
      </Path>
      <NoiseOverlay
        path="M -9 4 L -6.5 -2 L -4 1 L -1 -8 L 2 -1 L 5.5 -9 L 8.5 0 L 9 4 Z"
        blendMode="hardLight"
        opacity={0.7}
        freqX={0.35}
        freqY={0.5}
        octaves={4}
        seed={noiseSeed}
      />
      <Path
        path="M -9 4 L -6.5 -2 L -4 1 L -1 -8 L 2 -1 L 5.5 -9 L 8.5 0 L 9 4 Z"
        style="stroke"
        color={OUTLINE}
        strokeWidth={0.25}
      />
      {/* снег — только на двух самых высоких вершинах */}
      <Path path="M -1.7,-6.1 L -1,-8 L -0.3,-6.1 Z" color="#f4f7f8" opacity={0.95} style="fill" />
      <Path path="M 4.8,-7.2 L 5.5,-9 L 6.2,-7.2 Z" color="#f4f7f8" opacity={0.95} style="fill" />
      {/* пара тёмных расщелин для фактуры склона */}
      <Path
        path="M -4 1 L -2.6 -2.6 M 2 -1 L 3.1 -4.3"
        style="stroke"
        color="rgba(16, 24, 32, 0.35)"
        strokeWidth={0.3}
        strokeCap="round"
      />
    </Group>
  );
}
