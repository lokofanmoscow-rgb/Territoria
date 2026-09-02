import { G, Path, Polygon, Rect } from 'react-native-svg';

import { shade } from '../utils/color';
import type { ReliefType } from '../utils/terrain';

interface TerrainGlyphProps {
  type: ReliefType;
  x: number;
  y: number;
  size: number;
  rotation: number;
  biomeColor: string;
}

// Значки нарисованы в локальном боксе примерно -5..5 и растягиваются до
// нужного размера через scale — так один и тот же path работает для любой
// провинции независимо от масштаба карты.
export default function TerrainGlyph({ type, x, y, size, rotation, biomeColor }: TerrainGlyphProps) {
  if (type === 'none') return null;

  const scale = size / 5;
  const darkShade = shade(biomeColor, 0.55);
  const lightShade = shade(biomeColor, 1.3);

  return (
    <G transform={`translate(${x} ${y}) rotate(${rotation}) scale(${scale})`}>
      {type === 'forest' && (
        <>
          <Rect x={-0.4} y={2} width={0.8} height={1.6} fill="#4a3524" opacity={0.9} />
          <Polygon points="0,-2.6 -2.8,1.6 2.8,1.6" fill={darkShade} opacity={0.95} />
          <Polygon points="0,-5 -2,-1 2,-1" fill={darkShade} opacity={0.95} />
        </>
      )}
      {type === 'mountains' && (
        <>
          <Polygon points="-6,2 -3,-2 0,2" fill={darkShade} opacity={0.85} />
          <Polygon points="-4,2 0,-5 4,2" fill={darkShade} />
          <Polygon points="-1.2,-3 0,-5 1.2,-3" fill="#eef3f5" opacity={0.9} />
        </>
      )}
      {type === 'hills' && (
        <>
          <Path d="M -5 2 Q -2.5 -3 0 2" stroke={darkShade} strokeWidth={0.6} fill="none" opacity={0.8} />
          <Path d="M -1 2 Q 1.5 -2 4 2" stroke={darkShade} strokeWidth={0.6} fill="none" opacity={0.7} />
        </>
      )}
      {type === 'dunes' && (
        <>
          <Path
            d="M -5 0 Q -2.5 -2 0 0 Q 2.5 2 5 0"
            stroke={darkShade}
            strokeWidth={0.6}
            fill="none"
            opacity={0.7}
          />
          <Path
            d="M -5 2.5 Q -2.5 0.5 0 2.5 Q 2.5 4.5 5 2.5"
            stroke={darkShade}
            strokeWidth={0.6}
            fill="none"
            opacity={0.5}
          />
        </>
      )}
      {type === 'grass' && (
        <>
          <Path d="M 0 3 Q -1 -1 -2 -4" stroke={lightShade} strokeWidth={0.5} fill="none" opacity={0.8} />
          <Path d="M 0 3 Q 0 -2 0 -5" stroke={lightShade} strokeWidth={0.5} fill="none" opacity={0.8} />
          <Path d="M 0 3 Q 1 -1 2 -4" stroke={lightShade} strokeWidth={0.5} fill="none" opacity={0.8} />
        </>
      )}
    </G>
  );
}
