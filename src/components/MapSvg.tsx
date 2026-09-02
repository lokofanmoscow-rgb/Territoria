import Svg, { Defs, Path, RadialGradient, Rect, Stop } from 'react-native-svg';

import type { MapData } from '../types/map';
import { getBiome } from '../utils/biome';
import { parseViewBox, pointsToPath } from '../utils/geometry';
import ProvincePolygon from './ProvincePolygon';
import UnitBadge from './UnitBadge';

export interface ProvinceOwnership {
  color: string;
  troops: number;
}

interface MapSvgProps {
  map: MapData;
  provinceOwners?: Record<number, ProvinceOwnership>;
  selectedProvinceId?: number | null;
  onProvincePress?: (provinceId: number) => void;
}

export default function MapSvg({
  map,
  provinceOwners,
  selectedProvinceId,
  onProvincePress,
}: MapSvgProps) {
  const { x, y, width, height } = parseViewBox(map.viewBox);
  const coastline = pointsToPath(map.boundary);

  return (
    <Svg viewBox={map.viewBox} width="100%" height="100%">
      <Defs>
        <RadialGradient id="ocean" cx="50%" cy="50%" r="75%">
          <Stop offset="0%" stopColor="#2f7fa0" stopOpacity={1} />
          <Stop offset="100%" stopColor="#0f3a52" stopOpacity={1} />
        </RadialGradient>
      </Defs>

      <Rect x={x} y={y} width={width} height={height} fill="url(#ocean)" />

      {/* Мелководье: широкая полупрозрачная обводка береговой линии — половина
          уйдёт под провинции, снаружи останется мягкий голубой ореол у берега. */}
      <Path d={coastline} fill="none" stroke="rgba(120, 190, 210, 0.35)" strokeWidth={16} strokeLinejoin="round" />

      {map.provinces.map((province) => {
        const biome = getBiome(province, map);
        const ownership = provinceOwners?.[province.id];
        return (
          <ProvincePolygon
            key={province.id}
            province={province}
            biomeColor={biome.color}
            ownerColor={ownership?.color}
            selected={province.id === selectedProvinceId}
            onPress={onProvincePress}
          />
        );
      })}

      {/* Чёткая песчаная кромка поверх провинций — граница суши и моря. */}
      <Path d={coastline} fill="none" stroke="#d9c087" strokeWidth={2.5} strokeLinejoin="round" />

      {map.provinces.map((province) => {
        const ownership = provinceOwners?.[province.id];
        if (!ownership) return null;
        return (
          <UnitBadge
            key={`unit-${province.id}`}
            x={province.centroid[0]}
            y={province.centroid[1]}
            color={ownership.color}
            troops={ownership.troops}
          />
        );
      })}
    </Svg>
  );
}
