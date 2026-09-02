import { Circle, G, Path, Text } from 'react-native-svg';

interface UnitBadgeProps {
  x: number;
  y: number;
  color: string;
  troops: number;
}

// Геральдический щит вместо голого числа: форма читается как "тут стоят
// войска" уже по силуэту, скрещенные клинки поверх усиливают это на
// маленьком масштабе карты, а число вынесено в отдельный бейдж-кружок.
const SHIELD_PATH = 'M -8 -9 L 8 -9 L 8 1 Q 8 7 0 10 Q -8 7 -8 1 Z';
const BLADES_PATH = 'M -4 -6 L 4 4 M 4 -6 L -4 4';

export default function UnitBadge({ x, y, color, troops }: UnitBadgeProps) {
  return (
    <G x={x} y={y}>
      <Path d={SHIELD_PATH} fill={color} stroke="#101820" strokeWidth={1} />
      <Path d={BLADES_PATH} stroke="#ffffff" strokeWidth={1.3} strokeLinecap="round" opacity={0.85} />
      <Circle cx={7} cy={9} r={6} fill="#101820" stroke="#ffffff" strokeWidth={1} />
      <Text x={7} y={12} fontSize={8} fontWeight="700" fill="#ffffff" textAnchor="middle">
        {troops}
      </Text>
    </G>
  );
}
