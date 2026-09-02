import { G, Path, Polygon, Rect } from 'react-native-svg';

import type { ReliefType } from '../utils/terrain';

interface TerrainGlyphProps {
  type: ReliefType;
  x: number;
  y: number;
  size: number;
  rotation: number;
}

const OUTLINE = 'rgba(16, 24, 32, 0.55)';

// Фиксированные тона (не завязаны на цвет провинции под ними) с тёмной
// обводкой — значки должны одинаково хорошо читаться и на приглушённой
// нейтральной земле, и на насыщенной сплошной заливке цветом фракции.
export default function TerrainGlyph({ type, x, y, size, rotation }: TerrainGlyphProps) {
  if (type === 'none') return null;

  const scale = size / 5;

  return (
    <G transform={`translate(${x} ${y}) rotate(${rotation}) scale(${scale})`}>
      {type === 'forest' && (
        <>
          <Rect x={-0.4} y={2} width={0.8} height={1.6} fill="#4a3524" />
          <Polygon points="0,-2.6 -2.8,1.6 2.8,1.6" fill="#2f6b3a" stroke={OUTLINE} strokeWidth={0.3} />
          <Polygon points="0,-5 -2,-1 2,-1" fill="#357a41" stroke={OUTLINE} strokeWidth={0.3} />
        </>
      )}
      {type === 'mountains' && (
        <>
          <Polygon points="-6,2 -3,-2 0,2" fill="#7a6f61" stroke={OUTLINE} strokeWidth={0.3} />
          <Polygon points="-4,2 0,-5 4,2" fill="#8b7d6b" stroke={OUTLINE} strokeWidth={0.35} />
          <Polygon points="-1.2,-3 0,-5 1.2,-3" fill="#f2f5f6" />
        </>
      )}
      {type === 'hills' && (
        <>
          <Path d="M -5 2 Q -2.5 -3 0 2" stroke="#6b5a35" strokeWidth={0.7} fill="none" opacity={0.85} />
          <Path d="M -1 2 Q 1.5 -2 4 2" stroke="#6b5a35" strokeWidth={0.7} fill="none" opacity={0.7} />
        </>
      )}
      {type === 'dunes' && (
        <>
          <Path
            d="M -5 0 Q -2.5 -2 0 0 Q 2.5 2 5 0"
            stroke="#a5793a"
            strokeWidth={0.7}
            fill="none"
            opacity={0.75}
          />
          <Path
            d="M -5 2.5 Q -2.5 0.5 0 2.5 Q 2.5 4.5 5 2.5"
            stroke="#a5793a"
            strokeWidth={0.7}
            fill="none"
            opacity={0.55}
          />
        </>
      )}
      {type === 'grass' && (
        <>
          <Path d="M 0 3 Q -1 -1 -2 -4" stroke="#4f7a2f" strokeWidth={0.6} fill="none" opacity={0.85} />
          <Path d="M 0 3 Q 0 -2 0 -5" stroke="#4f7a2f" strokeWidth={0.6} fill="none" opacity={0.85} />
          <Path d="M 0 3 Q 1 -1 2 -4" stroke="#4f7a2f" strokeWidth={0.6} fill="none" opacity={0.85} />
        </>
      )}
    </G>
  );
}
