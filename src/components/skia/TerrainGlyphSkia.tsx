import { Group, LinearGradient, Path, vec, type Vector } from '@shopify/react-native-skia';

import type { ReliefType } from '../../utils/terrain';

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

// Фиксированные тона (не завязаны на цвет провинции под ними) с тёмной
// обводкой — значки должны одинаково хорошо читаться и на приглушённой
// нейтральной земле, и на насыщенной сплошной заливке цветом фракции.
// Горы сюда не входят — см. MountainBorderGlyph.tsx (хребет на границе
// провинций, а не decoration внутри одной из них).
export default function TerrainGlyphSkia({ type, x, y, size, rotation }: TerrainGlyphSkiaProps) {
  if (type === 'none') return null;

  const scale = size / 5;

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
