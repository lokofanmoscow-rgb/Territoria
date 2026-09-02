import { Path } from 'react-native-svg';

import type { ProvinceStatic } from '../types/map';

interface ProvincePolygonProps {
  province: ProvinceStatic;
  fill: string;
  onPress?: (provinceId: number) => void;
}

export default function ProvincePolygon({ province, fill, onPress }: ProvincePolygonProps) {
  return (
    <Path
      d={province.svgPath}
      fill={fill}
      stroke="#101820"
      strokeWidth={2}
      onPress={onPress ? () => onPress(province.id) : undefined}
    />
  );
}
