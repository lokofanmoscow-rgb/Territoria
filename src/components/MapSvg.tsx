import Svg from 'react-native-svg';

import type { MapData } from '../types/map';
import ProvincePolygon from './ProvincePolygon';

const NEUTRAL_FILL = '#4a5568';

interface MapSvgProps {
  map: MapData;
  /** provinceId -> fill color; falls back to a neutral color when unset */
  provinceColors?: Record<number, string>;
  onProvincePress?: (provinceId: number) => void;
}

export default function MapSvg({ map, provinceColors, onProvincePress }: MapSvgProps) {
  return (
    <Svg viewBox={map.viewBox} width="100%" height="100%">
      {map.provinces.map((province) => (
        <ProvincePolygon
          key={province.id}
          province={province}
          fill={provinceColors?.[province.id] ?? NEUTRAL_FILL}
          onPress={onProvincePress}
        />
      ))}
    </Svg>
  );
}
