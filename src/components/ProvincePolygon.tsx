import { Path } from 'react-native-svg';

import type { ProvinceStatic } from '../types/map';

interface ProvincePolygonProps {
  province: ProvinceStatic;
  biomeColor: string;
  ownerColor?: string;
  selected?: boolean;
  onPress?: (provinceId: number) => void;
}

const NEUTRAL_BORDER = 'rgba(16, 24, 32, 0.35)';

export default function ProvincePolygon({
  province,
  biomeColor,
  ownerColor,
  selected,
  onPress,
}: ProvincePolygonProps) {
  const borderColor = selected ? '#ffffff' : (ownerColor ?? NEUTRAL_BORDER);
  const borderWidth = selected ? 3 : ownerColor ? 1.5 : 1;

  return (
    <>
      <Path d={province.svgPath} fill={biomeColor} />
      {ownerColor && <Path d={province.svgPath} fill={ownerColor} fillOpacity={0.45} />}
      {/* transparent top layer: carries the border + is the single hit-test
          target, so taps register regardless of whether the owner overlay above is present */}
      <Path
        d={province.svgPath}
        fill="transparent"
        stroke={borderColor}
        strokeWidth={borderWidth}
        strokeLinejoin="round"
        onPress={onPress ? () => onPress(province.id) : undefined}
      />
    </>
  );
}
