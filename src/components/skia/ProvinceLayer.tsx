import { LinearGradient, Path, vec } from '@shopify/react-native-skia';

import { shade } from '../../utils/color';
import NoiseOverlay from './NoiseOverlay';

interface ProvinceLayerProps {
  svgPath: string;
  points: [number, number][];
  fillColor: string;
  borderColor: string;
  borderWidth: number;
  selected?: boolean;
}

// Раньше заливка была сплошным плоским цветом — при уменьшении карты это
// читается как "просто закрашенный полигон" независимо от того, насколько
// тонкая фактура шума лежит поверх. Направленный градиент по высоте
// провинции (светлее сверху, темнее снизу — как будто свет падает сверху)
// даёт объём/рельеф, который виден сразу, а не только при зуме вплотную.
const LIGHT_FACTOR = 1.22;
const SHADOW_FACTOR = 0.78;

// Крупный шум (мягкие пятна фактуры почвы) + мелкое зерно поверх — вместе
// читаются как живая неровная поверхность, а не решётка ряби.
const COARSE_FREQ = 0.045;
const COARSE_ALPHA = 0.4;
const FINE_FREQ = 0.22;
const FINE_ALPHA = 0.28;

export default function ProvinceLayer({
  svgPath,
  points,
  fillColor,
  borderColor,
  borderWidth,
  selected,
}: ProvinceLayerProps) {
  const xs = points.map((p) => p[0]);
  const ys = points.map((p) => p[1]);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const cx = (minX + maxX) / 2;

  return (
    <>
      <Path path={svgPath} style="fill">
        <LinearGradient
          start={vec(cx, minY)}
          end={vec(cx, maxY)}
          colors={[shade(fillColor, LIGHT_FACTOR), fillColor, shade(fillColor, SHADOW_FACTOR)]}
        />
      </Path>
      <NoiseOverlay
        path={svgPath}
        blendMode="overlay"
        opacity={COARSE_ALPHA}
        freqX={COARSE_FREQ}
        freqY={COARSE_FREQ}
        octaves={3}
        seed={7}
      />
      <NoiseOverlay
        path={svgPath}
        blendMode="softLight"
        opacity={FINE_ALPHA}
        freqX={FINE_FREQ}
        freqY={FINE_FREQ}
        octaves={2}
        seed={23}
      />
      <Path
        path={svgPath}
        style="stroke"
        color={selected ? '#ffffff' : borderColor}
        strokeWidth={selected ? 3 : borderWidth}
        strokeJoin="round"
      />
    </>
  );
}
