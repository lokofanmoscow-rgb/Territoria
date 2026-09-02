import { Circle, G, Path, Polygon, Text } from 'react-native-svg';

interface SoldierFigureProps {
  x: number;
  y: number;
  color: string;
  troops: number;
}

const SKIN_TONE = '#e0b48c';
const OUTLINE = '#101820';

// Стилизованная фигурка-солдат вместо геральдического щита: голова, туника
// цветом фракции, ноги, флаг на копье того же цвета — читается как "тут
// стоит армия", а не как абстрактный значок владения.
export default function SoldierFigure({ x, y, color, troops }: SoldierFigureProps) {
  return (
    <G x={x} y={y}>
      <Path d="M 2.8 -5.5 L 7 -13" stroke="#6b4a2b" strokeWidth={0.6} strokeLinecap="round" />
      <Polygon points="7,-13 11,-11.4 7,-10" fill={color} stroke={OUTLINE} strokeWidth={0.3} />

      <Polygon
        points="-3.4,0.5 -0.4,0.5 -1.3,6 -3.6,6"
        fill="#33383f"
        stroke={OUTLINE}
        strokeWidth={0.3}
      />
      <Polygon
        points="0.4,0.5 3.4,0.5 3.6,6 1.3,6"
        fill="#33383f"
        stroke={OUTLINE}
        strokeWidth={0.3}
      />

      <Polygon
        points="-2.6,-7 2.6,-7 3.4,0.5 -3.4,0.5"
        fill={color}
        stroke={OUTLINE}
        strokeWidth={0.4}
      />
      <Path d="M 2.6 -6 L 2.8 -5.5" stroke={SKIN_TONE} strokeWidth={0.9} strokeLinecap="round" />
      <Circle cx={0} cy={-9} r={2.1} fill={SKIN_TONE} stroke={OUTLINE} strokeWidth={0.4} />

      <Circle cx={6.5} cy={3} r={3.4} fill="#101820" stroke="#ffffff" strokeWidth={0.6} />
      <Text x={6.5} y={4.2} fontSize={4.4} fontWeight="700" fill="#ffffff" textAnchor="middle">
        {troops}
      </Text>
    </G>
  );
}
