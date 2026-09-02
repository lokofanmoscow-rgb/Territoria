import { Path } from '@shopify/react-native-skia';

import NoiseOverlay from './NoiseOverlay';

interface ProvinceLayerProps {
  svgPath: string;
  fillColor: string;
  borderColor: string;
  borderWidth: number;
  selected?: boolean;
}

// Лёгкое "бумажное" зерно поверх сплошной заливки — фактура видна и на
// нейтральной земле, и на цвете фракции, а не только на горах.
const GRAIN_FREQ = 0.06;
const GRAIN_OCTAVES = 2;
const GRAIN_ALPHA = 0.3;

export default function ProvinceLayer({
  svgPath,
  fillColor,
  borderColor,
  borderWidth,
  selected,
}: ProvinceLayerProps) {
  return (
    <>
      <Path path={svgPath} color={fillColor} style="fill" />
      <NoiseOverlay
        path={svgPath}
        blendMode="overlay"
        opacity={GRAIN_ALPHA}
        freqX={GRAIN_FREQ}
        freqY={GRAIN_FREQ}
        octaves={GRAIN_OCTAVES}
        seed={7}
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
