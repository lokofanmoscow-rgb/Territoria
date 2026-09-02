import { useMemo } from 'react';
import { Group, Path, RadialGradient, Rect, matchFont, vec } from '@shopify/react-native-skia';

import { UNIT_TYPE_IDS, UNIT_TYPES } from '../../constants/unitTypes';
import { totalUnits } from '../../services/gameLogic';
import type { ArmyComposition } from '../../types/game';
import type { MapData, ProvinceStatic } from '../../types/map';
import { getBiome } from '../../utils/biome';
import { shade } from '../../utils/color';
import { parseViewBox, pointsToPath } from '../../utils/geometry';
import { hash } from '../../utils/random';
import { getReliefGlyphs } from '../../utils/terrain';
import ArmyIconSkia from './ArmyIconSkia';
import NoiseOverlay from './NoiseOverlay';
import ProvinceLayer from './ProvinceLayer';
import TerrainGlyphSkia from './TerrainGlyphSkia';

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

export interface MapSceneProps {
  map: MapData;
  provinceOwners?: Record<number, ProvinceOwnership>;
  selectedProvinceId?: number | null;
}

const NEUTRAL_BORDER = 'rgba(16, 24, 32, 0.35)';

// Владелец красит провинцию сплошным цветом (не оверлеем поверх биома —
// биом виден только через значки рельефа). Небольшая тональная вариация по
// id, чтобы страна не выглядела одним плоским пятном.
function getFillColor(province: ProvinceStatic, biomeColor: string, ownerColor?: string): string {
  if (!ownerColor) return biomeColor;
  const variation = 0.9 + (hash(province.id) % 16) / 100;
  return shade(ownerColor, variation);
}

// Внутри своей территории границы между провинциями почти не видны, а на
// стыке с чужим владением или нейтралом — жирная тёмная линия.
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

// Собственно сцена карты как дерево Skia-примитивов (без хостового <Canvas>)
// — вынесено отдельно от MapCanvas.tsx, чтобы его можно было рендерить и
// тестировать headless-снапшотами через SkiaSGRoot, не поднимая настоящий RN.
export default function MapScene({ map, provinceOwners, selectedProvinceId }: MapSceneProps) {
  const { x, y, width, height } = parseViewBox(map.viewBox);
  const coastline = pointsToPath(map.boundary);
  const badgeFont = useMemo(
    () => matchFont({ fontFamily: 'System', fontSize: 5.6, fontWeight: '800' }),
    [],
  );

  return (
    <>
      <Rect x={x} y={y} width={width} height={height} style="fill">
        <RadialGradient
          c={vec(x + width / 2, y + height / 2)}
          r={Math.max(width, height) * 0.75}
          colors={['#3f92b4', '#255e79']}
        />
      </Rect>
      <NoiseOverlay
        path={`M ${x} ${y} L ${x + width} ${y} L ${x + width} ${y + height} L ${x} ${y + height} Z`}
        blendMode="overlay"
        opacity={0.5}
        freqX={0.02}
        freqY={0.12}
        octaves={2}
        seed={3}
      />

      {/* Мелководье: широкая полупрозрачная обводка береговой линии — половина
          уйдёт под провинции, снаружи останется мягкий голубой ореол у берега. */}
      <Path path={coastline} style="stroke" color="rgba(150, 205, 220, 0.3)" strokeWidth={10} strokeJoin="round" />

      {map.provinces.map((province) => {
        const biome = getBiome(province, map);
        const ownership = provinceOwners?.[province.id];
        const border = getBorderStyle(province, ownership?.color, provinceOwners);
        return (
          <Group key={province.id}>
            <ProvinceLayer
              svgPath={province.svgPath}
              points={province.points}
              fillColor={getFillColor(province, biome.color, ownership?.color)}
              borderColor={border.color}
              borderWidth={border.width}
              selected={province.id === selectedProvinceId}
            />
            {getReliefGlyphs(province, biome.id).map((glyph, index) => (
              <TerrainGlyphSkia key={index} {...glyph} />
            ))}
          </Group>
        );
      })}

      {/* Тонкая светлая кромка поверх провинций — граница суши и моря. */}
      <Path path={coastline} style="stroke" color="#eee3c4" strokeWidth={1.5} strokeJoin="round" />

      {map.provinces.map((province) => {
        const ownership = provinceOwners?.[province.id];
        const troops = ownership ? totalUnits(ownership.units) : 0;
        if (!ownership || troops <= 0) return null;
        return (
          <ArmyIconSkia
            key={`unit-${province.id}`}
            x={province.centroid[0]}
            y={province.centroid[1]}
            color={ownership.color}
            troops={troops}
            unitType={getDominantUnitType(ownership.units)}
            font={badgeFont}
          />
        );
      })}
    </>
  );
}
