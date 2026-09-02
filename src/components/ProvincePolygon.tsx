import { Path } from 'react-native-svg';

import type { ProvinceStatic } from '../types/map';

interface ProvincePolygonProps {
  province: ProvinceStatic;
  fillColor: string;
  borderColor: string;
  borderWidth: number;
  selected?: boolean;
  onPress?: (provinceId: number) => void;
}

export default function ProvincePolygon({
  province,
  fillColor,
  borderColor,
  borderWidth,
  selected,
  onPress,
}: ProvincePolygonProps) {
  return (
    <>
      <Path d={province.svgPath} fill={fillColor} />
      {/* transparent top layer: carries the border + is the single hit-test
          target, so taps register regardless of how many layers sit underneath */}
      <Path
        d={province.svgPath}
        fill="transparent"
        stroke={selected ? '#ffffff' : borderColor}
        strokeWidth={selected ? 3 : borderWidth}
        strokeLinejoin="round"
        onPress={onPress ? () => onPress(province.id) : undefined}
      />
    </>
  );
}
