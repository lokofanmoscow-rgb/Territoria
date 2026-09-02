import { Group, LinearGradient, Path, vec, type Vector } from '@shopify/react-native-skia';

import type { ReliefType } from '../../utils/terrain';
import { hash } from '../../utils/random';
import NoiseOverlay from './NoiseOverlay';

interface TerrainGlyphSkiaProps {
  type: ReliefType;
  x: number;
  y: number;
  size: number;
  rotation: number;
}

const OUTLINE = 'rgba(16, 24, 32, 0.55)';

const FOREST_CANOPY: Vector[] = [vec(0, 1), vec(0, -5)];
const FOREST_CANOPY_COLORS = ['#2a5c34', '#4f9257'];

const MOUNTAIN_FRONT: Vector[] = [vec(0, 4), vec(0, -9)];
const MOUNTAIN_FRONT_COLORS = ['#564f45', '#a89c8d'];
const MOUNTAIN_BACK: Vector[] = [vec(0, 4), vec(0, -8)];
const MOUNTAIN_BACK_COLORS = ['rgba(139, 149, 161, 0.55)', 'rgba(195, 204, 211, 0.55)'];

// Фиксированные тона (не завязаны на цвет провинции под ними) с тёмной
// обводкой — значки должны одинаково хорошо читаться и на приглушённой
// нейтральной земле, и на насыщенной сплошной заливке цветом фракции.
export default function TerrainGlyphSkia({ type, x, y, size, rotation }: TerrainGlyphSkiaProps) {
  if (type === 'none') return null;

  const scale = size / 5;
  // Разный сдвиг шума на каждый хребет, иначе все горы на карте показывают
  // одну и ту же скальную фактуру (детерминированно от позиции, не от рандома).
  const noiseSeed = hash(Math.round(x) * 131 + Math.round(y) * 977) % 97;

  return (
    <Group transform={[{ translateX: x }, { translateY: y }, { rotate: (rotation * Math.PI) / 180 }, { scale }]}>
      {type === 'forest' && (
        <>
          <Path path="M -0.4 3.6 L 0.4 3.6 L 0.4 2 L -0.4 2 Z" color="#4a3524" style="fill" />
          <Path path="M 0,-2.6 L -2.8,1.6 L 2.8,1.6 Z" style="fill">
            <LinearGradient start={FOREST_CANOPY[0]} end={FOREST_CANOPY[1]} colors={FOREST_CANOPY_COLORS} />
          </Path>
          <Path path="M 0,-2.6 L -2.8,1.6 L 2.8,1.6 Z" style="stroke" color={OUTLINE} strokeWidth={0.3} />
          <Path path="M 0,-5 L -2,-1 L 2,-1 Z" style="fill">
            <LinearGradient start={FOREST_CANOPY[0]} end={FOREST_CANOPY[1]} colors={FOREST_CANOPY_COLORS} />
          </Path>
          <Path path="M 0,-5 L -2,-1 L 2,-1 Z" style="stroke" color={OUTLINE} strokeWidth={0.3} />
        </>
      )}
      {type === 'mountains' && (
        <>
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
        </>
      )}
      {type === 'hills' && (
        <>
          <Path path="M -5 2 Q -2.5 -3 0 2" style="stroke" color="#6b5a35" strokeWidth={0.7} opacity={0.85} />
          <Path path="M -1 2 Q 1.5 -2 4 2" style="stroke" color="#6b5a35" strokeWidth={0.7} opacity={0.7} />
        </>
      )}
      {type === 'dunes' && (
        <>
          <Path
            path="M -5 0 Q -2.5 -2 0 0 Q 2.5 2 5 0"
            style="stroke"
            color="#a5793a"
            strokeWidth={0.7}
            opacity={0.75}
          />
          <Path
            path="M -5 2.5 Q -2.5 0.5 0 2.5 Q 2.5 4.5 5 2.5"
            style="stroke"
            color="#a5793a"
            strokeWidth={0.7}
            opacity={0.55}
          />
        </>
      )}
      {type === 'grass' && (
        <>
          <Path path="M 0 3 Q -1 -1 -2 -4" style="stroke" color="#4f7a2f" strokeWidth={0.6} opacity={0.85} />
          <Path path="M 0 3 Q 0 -2 0 -5" style="stroke" color="#4f7a2f" strokeWidth={0.6} opacity={0.85} />
          <Path path="M 0 3 Q 1 -1 2 -4" style="stroke" color="#4f7a2f" strokeWidth={0.6} opacity={0.85} />
        </>
      )}
    </Group>
  );
}
