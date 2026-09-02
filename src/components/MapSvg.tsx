import { Fragment } from 'react';
import Svg, { Defs, Path, RadialGradient, Rect, Stop } from 'react-native-svg';

import { UNIT_TYPE_IDS, UNIT_TYPES } from '../constants/unitTypes';
import { totalUnits } from '../services/gameLogic';
import type { ArmyComposition } from '../types/game';
import type { MapData, ProvinceStatic } from '../types/map';
import { getBiome } from '../utils/biome';
import { shade } from '../utils/color';
import { parseViewBox, pointsToPath } from '../utils/geometry';
import { hash } from '../utils/random';
import { getReliefGlyphs } from '../utils/terrain';
import ArmyIcon from './ArmyIcon';
import ProvincePolygon from './ProvincePolygon';
import TerrainGlyph from './TerrainGlyph';

export interface ProvinceOwnership {
  color: string;
  units: ArmyComposition;
}

// Тип юнита, которого в составе больше всего по силе атаки — определяет,
// какой силуэт рисовать на карте (пехота/кавалерия/артиллерия).
function getDominantUnitType(units: ArmyComposition) {
  return UNIT_TYPE_IDS.reduce((dominant, type) => {
    const power = (units[type] ?? 0) * UNIT_TYPES[type].attack;
    const dominantPower = (units[dominant] ?? 0) * UNIT_TYPES[dominant].attack;
    return power > dominantPower ? type : dominant;
  }, UNIT_TYPE_IDS[0]);
}

interface MapSvgProps {
  map: MapData;
  provinceOwners?: Record<number, ProvinceOwnership>;
  selectedProvinceId?: number | null;
  onProvincePress?: (provinceId: number) => void;
}

const NEUTRAL_BORDER = 'rgba(16, 24, 32, 0.35)';

// Владелец красит провинцию сплошным цветом (не оверлеем поверх биома —
// биом виден только через значки рельефа). Небольшая тональная вариация по
// id, чтобы страна не выглядела одним плоским пятном, как на референсной
// карте, где соседние провинции одного цвета чуть отличаются оттенком.
function getFillColor(province: ProvinceStatic, biomeColor: string, ownerColor?: string): string {
  if (!ownerColor) return biomeColor;
  const variation = 0.9 + (hash(province.id) % 16) / 100;
  return shade(ownerColor, variation);
}

// Внутри своей территории границы между провинциями почти не видны (как
// цельный блок цвета на политической карте), а на стыке с чужим владением
// или нейтралом — жирная тёмная линия.
function getBorderStyle(
  province: ProvinceStatic,
  ownerColor: string | undefined,
  provinceOwners: Record<number, ProvinceOwnership> | undefined,
): { color: string; width: number } {
  if (!ownerColor) return { color: NEUTRAL_BORDER, width: 1 };

  const isFrontier =
    province.neighbors.length === 0 ||
    province.neighbors.some((neighborId) => provinceOwners?.[neighborId]?.color !== ownerColor);

  return isFrontier
    ? { color: 'rgba(16, 24, 32, 0.6)', width: 2 }
    : { color: 'rgba(16, 24, 32, 0.12)', width: 0.5 };
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
    <Svg viewBox={map.viewBox} width={width} height={height}>
      <Defs>
        <RadialGradient id="ocean" cx="50%" cy="50%" r="75%">
          <Stop offset="0%" stopColor="#3f92b4" stopOpacity={1} />
          <Stop offset="100%" stopColor="#255e79" stopOpacity={1} />
        </RadialGradient>
      </Defs>

      <Rect x={x} y={y} width={width} height={height} fill="url(#ocean)" />

      {/* Мелководье: широкая полупрозрачная обводка береговой линии — половина
          уйдёт под провинции, снаружи останется мягкий голубой ореол у берега. */}
      <Path d={coastline} fill="none" stroke="rgba(150, 205, 220, 0.3)" strokeWidth={10} strokeLinejoin="round" />

      {map.provinces.map((province) => {
        const biome = getBiome(province, map);
        const ownership = provinceOwners?.[province.id];
        const border = getBorderStyle(province, ownership?.color, provinceOwners);
        return (
          <Fragment key={province.id}>
            <ProvincePolygon
              province={province}
              fillColor={getFillColor(province, biome.color, ownership?.color)}
              borderColor={border.color}
              borderWidth={border.width}
              selected={province.id === selectedProvinceId}
              onPress={onProvincePress}
            />
            {getReliefGlyphs(province, biome.id).map((glyph, index) => (
              <TerrainGlyph key={index} {...glyph} />
            ))}
          </Fragment>
        );
      })}

      {/* Тонкая светлая кромка поверх провинций — граница суши и моря. */}
      <Path d={coastline} fill="none" stroke="#eee3c4" strokeWidth={1.5} strokeLinejoin="round" />

      {map.provinces.map((province) => {
        const ownership = provinceOwners?.[province.id];
        const troops = ownership ? totalUnits(ownership.units) : 0;
        if (!ownership || troops <= 0) return null;
        return (
          <ArmyIcon
            key={`unit-${province.id}`}
            x={province.centroid[0]}
            y={province.centroid[1]}
            color={ownership.color}
            troops={troops}
            unitType={getDominantUnitType(ownership.units)}
          />
        );
      })}
    </Svg>
  );
}
