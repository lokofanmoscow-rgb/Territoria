import { Circle, Ellipse, G, Path, Polygon, Rect, Text } from 'react-native-svg';

import type { UnitType } from '../constants/unitTypes';

interface ArmyIconProps {
  x: number;
  y: number;
  color: string;
  troops: number;
  unitType: UnitType;
}

const SKIN_TONE = '#e0b48c';
const OUTLINE = '#101820';
const HORSE_TONE = '#5c4530';

function Banner({ color }: { color: string }) {
  return (
    <>
      <Path d="M 2.8 -5.5 L 7 -13" stroke="#6b4a2b" strokeWidth={0.6} strokeLinecap="round" />
      <Polygon points="7,-13 11,-11.4 7,-10" fill={color} stroke={OUTLINE} strokeWidth={0.3} />
    </>
  );
}

function InfantryFigure({ color }: { color: string }) {
  return (
    <>
      <Banner color={color} />
      <Polygon points="-3.4,0.5 -0.4,0.5 -1.3,6 -3.6,6" fill="#33383f" stroke={OUTLINE} strokeWidth={0.3} />
      <Polygon points="0.4,0.5 3.4,0.5 3.6,6 1.3,6" fill="#33383f" stroke={OUTLINE} strokeWidth={0.3} />
      <Polygon points="-2.6,-7 2.6,-7 3.4,0.5 -3.4,0.5" fill={color} stroke={OUTLINE} strokeWidth={0.4} />
      <Path d="M 2.6 -6 L 2.8 -5.5" stroke={SKIN_TONE} strokeWidth={0.9} strokeLinecap="round" />
      <Circle cx={0} cy={-9} r={2.1} fill={SKIN_TONE} stroke={OUTLINE} strokeWidth={0.4} />
    </>
  );
}

function CavalryFigure({ color }: { color: string }) {
  return (
    <>
      <Path d="M -1 -4 L 4.5 -10" stroke="#6b4a2b" strokeWidth={0.6} strokeLinecap="round" />
      <Polygon points="4.5,-10 8,-8.6 4.5,-7.4" fill={color} stroke={OUTLINE} strokeWidth={0.3} />

      <Path d="M -4.5 1 L -6 5.5 M -1.5 1 L -1 5.5 M 1.5 1 L 2.5 5.5 M 4.2 0 L 5.5 5" stroke={HORSE_TONE} strokeWidth={0.9} strokeLinecap="round" />
      <Ellipse cx={-0.5} cy={0} rx={5} ry={2.3} fill={HORSE_TONE} stroke={OUTLINE} strokeWidth={0.35} />
      <Polygon points="-5.2,-1.2 -7.6,-1.6 -5.6,0.6" fill={HORSE_TONE} stroke={OUTLINE} strokeWidth={0.3} />

      <Circle cx={0.5} cy={-5.4} r={1.7} fill={SKIN_TONE} stroke={OUTLINE} strokeWidth={0.35} />
      <Polygon points="-1.4,-3.6 2.4,-3.6 2.9,-1" fill={color} stroke={OUTLINE} strokeWidth={0.35} />
    </>
  );
}

function ArtilleryFigure({ color }: { color: string }) {
  return (
    <>
      <G rotation={-28} originX={0} originY={2}>
        <Rect x={-1.4} y={-6.5} width={2.8} height={8.5} rx={0.6} fill="#4a4d52" stroke={OUTLINE} strokeWidth={0.35} />
      </G>
      <Rect x={-4.4} y={1.4} width={8.8} height={2.6} rx={0.6} fill={color} stroke={OUTLINE} strokeWidth={0.35} />
      <Circle cx={-2.6} cy={4.6} r={1.9} fill="#33383f" stroke={OUTLINE} strokeWidth={0.35} />
      <Circle cx={2.6} cy={4.6} r={1.9} fill="#33383f" stroke={OUTLINE} strokeWidth={0.35} />
      <Circle cx={-2.6} cy={4.6} r={0.6} fill="#8a8f96" />
      <Circle cx={2.6} cy={4.6} r={0.6} fill="#8a8f96" />
    </>
  );
}

const FIGURES: Record<UnitType, (props: { color: string }) => React.JSX.Element> = {
  infantry: InfantryFigure,
  cavalry: CavalryFigure,
  artillery: ArtilleryFigure,
};

// Две копии значка (меньшая позади, смещённая и полупрозрачная) вместо одной
// — читается как "стопка войск", а не одинокая единица. Силуэт зависит от
// самого сильного (по attack) типа юнита в составе, бейдж — суммарная
// численность всех типов.
export default function ArmyIcon({ x, y, color, troops, unitType }: ArmyIconProps) {
  const Figure = FIGURES[unitType];

  return (
    <G x={x} y={y}>
      <G transform="translate(-4.5, 2) scale(0.7)" opacity={0.7}>
        <Figure color={color} />
      </G>
      <Figure color={color} />

      <Circle cx={5.5} cy={9} r={4.4} fill="#101820" stroke="#ffffff" strokeWidth={0.8} />
      <Text x={5.5} y={10.7} fontSize={5.6} fontWeight="800" fill="#ffffff" textAnchor="middle">
        {troops}
      </Text>
    </G>
  );
}
