import { Circle, G, Path, Polygon, Text } from 'react-native-svg';

interface SoldierFigureProps {
  x: number;
  y: number;
  color: string;
  troops: number;
}

const SKIN_TONE = '#e0b48c';
const OUTLINE = '#101820';

function Figure({ color }: { color: string }) {
  return (
    <>
      <Path d="M 2.8 -5.5 L 7 -13" stroke="#6b4a2b" strokeWidth={0.6} strokeLinecap="round" />
      <Polygon points="7,-13 11,-11.4 7,-10" fill={color} stroke={OUTLINE} strokeWidth={0.3} />
      <Polygon points="-3.4,0.5 -0.4,0.5 -1.3,6 -3.6,6" fill="#33383f" stroke={OUTLINE} strokeWidth={0.3} />
      <Polygon points="0.4,0.5 3.4,0.5 3.6,6 1.3,6" fill="#33383f" stroke={OUTLINE} strokeWidth={0.3} />
      <Polygon points="-2.6,-7 2.6,-7 3.4,0.5 -3.4,0.5" fill={color} stroke={OUTLINE} strokeWidth={0.4} />
      <Path d="M 2.6 -6 L 2.8 -5.5" stroke={SKIN_TONE} strokeWidth={0.9} strokeLinecap="round" />
      <Circle cx={0} cy={-9} r={2.1} fill={SKIN_TONE} stroke={OUTLINE} strokeWidth={0.4} />
    </>
  );
}

// Две фигуры (меньшая позади, смещённая и полупрозрачная) вместо одной —
// читается как "стопка войск", а не одинокий солдат. Бейдж с числом крупный
// и контрастный, чтобы размер армии было видно даже на плотной карте.
export default function SoldierFigure({ x, y, color, troops }: SoldierFigureProps) {
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
