import { Circle, Group, Oval, Path, Text, type SkFont } from '@shopify/react-native-skia';

import type { UnitType } from '../../constants/unitTypes';

interface ArmyIconSkiaProps {
  x: number;
  y: number;
  color: string;
  troops: number;
  unitType: UnitType;
  font: SkFont | null;
}

const SKIN_TONE = '#e0b48c';
const OUTLINE = '#101820';
const HORSE_TONE = '#5c4530';

function Banner({ color }: { color: string }) {
  return (
    <>
      <Path path="M 2.8 -5.5 L 7 -13" style="stroke" color="#6b4a2b" strokeWidth={0.6} strokeCap="round" />
      <Path path="M 7,-13 L 11,-11.4 L 7,-10 Z" color={color} style="fill" />
      <Path path="M 7,-13 L 11,-11.4 L 7,-10 Z" style="stroke" color={OUTLINE} strokeWidth={0.3} />
    </>
  );
}

function InfantryFigure({ color }: { color: string }) {
  return (
    <>
      <Banner color={color} />
      <Path path="M -3.4,0.5 L -0.4,0.5 L -1.3,6 L -3.6,6 Z" color="#33383f" style="fill" />
      <Path path="M -3.4,0.5 L -0.4,0.5 L -1.3,6 L -3.6,6 Z" style="stroke" color={OUTLINE} strokeWidth={0.3} />
      <Path path="M 0.4,0.5 L 3.4,0.5 L 3.6,6 L 1.3,6 Z" color="#33383f" style="fill" />
      <Path path="M 0.4,0.5 L 3.4,0.5 L 3.6,6 L 1.3,6 Z" style="stroke" color={OUTLINE} strokeWidth={0.3} />
      <Path path="M -2.6,-7 L 2.6,-7 L 3.4,0.5 L -3.4,0.5 Z" color={color} style="fill" />
      <Path path="M -2.6,-7 L 2.6,-7 L 3.4,0.5 L -3.4,0.5 Z" style="stroke" color={OUTLINE} strokeWidth={0.4} />
      <Path path="M 2.6 -6 L 2.8 -5.5" style="stroke" color={SKIN_TONE} strokeWidth={0.9} strokeCap="round" />
      <Circle cx={0} cy={-9} r={2.1} color={SKIN_TONE} style="fill" />
      <Circle cx={0} cy={-9} r={2.1} color={OUTLINE} style="stroke" strokeWidth={0.4} />
    </>
  );
}

function CavalryFigure({ color }: { color: string }) {
  return (
    <>
      <Path path="M -1 -4 L 4.5 -10" style="stroke" color="#6b4a2b" strokeWidth={0.6} strokeCap="round" />
      <Path path="M 4.5,-10 L 8,-8.6 L 4.5,-7.4 Z" color={color} style="fill" />
      <Path path="M 4.5,-10 L 8,-8.6 L 4.5,-7.4 Z" style="stroke" color={OUTLINE} strokeWidth={0.3} />

      <Path
        path="M -4.5 1 L -6 5.5 M -1.5 1 L -1 5.5 M 1.5 1 L 2.5 5.5 M 4.2 0 L 5.5 5"
        style="stroke"
        color={HORSE_TONE}
        strokeWidth={0.9}
        strokeCap="round"
      />
      <Oval x={-5.5} y={-2.3} width={10} height={4.6} color={HORSE_TONE} style="fill" />
      <Oval x={-5.5} y={-2.3} width={10} height={4.6} color={OUTLINE} style="stroke" strokeWidth={0.35} />
      <Path path="M -5.2,-1.2 L -7.6,-1.6 L -5.6,0.6 Z" color={HORSE_TONE} style="fill" />
      <Path path="M -5.2,-1.2 L -7.6,-1.6 L -5.6,0.6 Z" style="stroke" color={OUTLINE} strokeWidth={0.3} />

      <Circle cx={0.5} cy={-5.4} r={1.7} color={SKIN_TONE} style="fill" />
      <Circle cx={0.5} cy={-5.4} r={1.7} color={OUTLINE} style="stroke" strokeWidth={0.35} />
      <Path path="M -1.4,-3.6 L 2.4,-3.6 L 2.9,-1 Z" color={color} style="fill" />
      <Path path="M -1.4,-3.6 L 2.4,-3.6 L 2.9,-1 Z" style="stroke" color={OUTLINE} strokeWidth={0.35} />
    </>
  );
}

function ArtilleryFigure({ color }: { color: string }) {
  return (
    <>
      <Group transform={[{ rotate: (-28 * Math.PI) / 180 }]} origin={{ x: 0, y: 2 }}>
        <Path
          path="M -1.4,-6.5 L 1.4,-6.5 L 1.4,2 L -1.4,2 Z"
          color="#4a4d52"
          style="fill"
        />
        <Path path="M -1.4,-6.5 L 1.4,-6.5 L 1.4,2 L -1.4,2 Z" style="stroke" color={OUTLINE} strokeWidth={0.35} />
      </Group>
      <Path path="M -4.4,1.4 L 4.4,1.4 L 4.4,4 L -4.4,4 Z" color={color} style="fill" />
      <Path path="M -4.4,1.4 L 4.4,1.4 L 4.4,4 L -4.4,4 Z" style="stroke" color={OUTLINE} strokeWidth={0.35} />
      <Circle cx={-2.6} cy={4.6} r={1.9} color="#33383f" style="fill" />
      <Circle cx={-2.6} cy={4.6} r={1.9} color={OUTLINE} style="stroke" strokeWidth={0.35} />
      <Circle cx={2.6} cy={4.6} r={1.9} color="#33383f" style="fill" />
      <Circle cx={2.6} cy={4.6} r={1.9} color={OUTLINE} style="stroke" strokeWidth={0.35} />
      <Circle cx={-2.6} cy={4.6} r={0.6} color="#8a8f96" style="fill" />
      <Circle cx={2.6} cy={4.6} r={0.6} color="#8a8f96" style="fill" />
    </>
  );
}

const FIGURES: Record<UnitType, (props: { color: string }) => React.JSX.Element> = {
  infantry: InfantryFigure,
  cavalry: CavalryFigure,
  artillery: ArtilleryFigure,
};

// Две копии значка (меньшая позади, смещённая и полупрозрачная) вместо одной
// — читается как "стопка войск". Силуэт зависит от самого сильного (по
// attack) типа юнита в составе, бейдж — суммарная численность всех типов.
export default function ArmyIconSkia({ x, y, color, troops, unitType, font }: ArmyIconSkiaProps) {
  const Figure = FIGURES[unitType];
  const label = String(troops);
  const textWidth = font ? font.getTextWidth(label) : label.length * 3.5;

  return (
    <Group transform={[{ translateX: x }, { translateY: y }]}>
      <Group transform={[{ translateX: -4.5 }, { translateY: 2 }, { scale: 0.7 }]} opacity={0.7}>
        <Figure color={color} />
      </Group>
      <Figure color={color} />

      <Circle cx={5.5} cy={9} r={4.4} color="#101820" style="fill" />
      <Circle cx={5.5} cy={9} r={4.4} color="#ffffff" style="stroke" strokeWidth={0.8} />
      {font && (
        <Text x={5.5 - textWidth / 2} y={10.7} text={label} font={font} color="#ffffff" />
      )}
    </Group>
  );
}
