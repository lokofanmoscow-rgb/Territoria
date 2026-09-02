import { Ellipse, G, Path, Polygon, Rect } from 'react-native-svg';

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
          <Polygon points="0,-2.6 -2.8,1.6 2.8,1.6" fill="url(#forestCanopy)" stroke={OUTLINE} strokeWidth={0.3} />
          <Polygon points="0,-5 -2,-1 2,-1" fill="url(#forestCanopy)" stroke={OUTLINE} strokeWidth={0.3} />
        </>
      )}
      {type === 'mountains' && (
        <>
          {/* тень под хребтом — прижимает его к земле */}
          <Ellipse cx={0} cy={4.3} rx={9} ry={1.5} fill="rgba(16, 24, 32, 0.22)" />
          {/* дальний план: ниже, светлее, полупрозрачный — воздушная перспектива */}
          <Path
            d="M -10 4 L -7.5 -3.3 L -5 -0.6 L -2 -6.2 L 1 -1.4 L 4.5 -5.3 L 7.5 -0.4 L 10 4 Z"
            fill="url(#mountainBack)"
          />
          {/* ближний план: собственно хребет, освещён сверху (градиент тёмный->светлый) */}
          <Path
            d="M -9 4 L -6.5 -2 L -4 1 L -1 -8 L 2 -1 L 5.5 -9 L 8.5 0 L 9 4 Z"
            fill="url(#mountainFront)"
            stroke={OUTLINE}
            strokeWidth={0.25}
          />
          {/* снег — только на двух самых высоких вершинах */}
          <Polygon points="-1.7,-6.1 -1,-8 -0.3,-6.1" fill="#f4f7f8" opacity={0.95} />
          <Polygon points="4.8,-7.2 5.5,-9 6.2,-7.2" fill="#f4f7f8" opacity={0.95} />
          {/* пара тёмных расщелин для фактуры склона */}
          <Path
            d="M -4 1 L -2.6 -2.6 M 2 -1 L 3.1 -4.3"
            stroke="rgba(16, 24, 32, 0.35)"
            strokeWidth={0.3}
            strokeLinecap="round"
          />
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
