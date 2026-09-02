import { ColorMatrix, Path, Turbulence, type PaintProps, type PathDef } from '@shopify/react-native-skia';

type BlendModeProp = NonNullable<PaintProps['blendMode']>;

// MakeTurbulence/MakeFractalNoise даёт ЦВЕТНОЙ шум (независимые R/G/B) —
// для "живой" фактуры земли/скал/воды нужен чёрно-белый (яркостный) шум,
// иначе видна радужная рябь. Стандартная luminance-матрица, альфу не трогаем.
//
// Turbulence и ColorMatrix — СОСЕДИ, не вложены друг в друга: react-native-skia
// сортирует прямых детей узла по типу (shader/colorFilter/...) и кладёт каждый
// на один и тот же Paint независимо (setShader + setColorFilter) — как в
// сыром CanvasKit-прототипе. Если ColorMatrix вложить ВНУТРЬ Turbulence,
// recorder падает с "Invalid color filter type", т.к. рекурсивный обход
// шейдерного поддерева считает всех потомков шейдерами.
export const GRAYSCALE_MATRIX = [
  0.2126, 0.7152, 0.0722, 0, 0,
  0.2126, 0.7152, 0.0722, 0, 0,
  0.2126, 0.7152, 0.0722, 0, 0,
  0, 0, 0, 1, 0,
];

interface NoiseOverlayProps {
  path: PathDef;
  blendMode: BlendModeProp;
  opacity: number;
  freqX: number;
  freqY: number;
  octaves?: number;
  seed: number;
}

// Второй проход поверх уже нарисованной формы (тем же path) — накладывает
// шум через blendMode вместо Shader.MakeBlend, потому что так к шейдеру
// шума можно применить ColorFilter (обесцветить), чего нельзя сделать после
// комбинирования шейдеров.
export default function NoiseOverlay({
  path,
  blendMode,
  opacity,
  freqX,
  freqY,
  octaves = 3,
  seed,
}: NoiseOverlayProps) {
  return (
    <Path path={path} blendMode={blendMode} opacity={opacity}>
      <Turbulence freqX={freqX} freqY={freqY} octaves={octaves} seed={seed} />
      <ColorMatrix matrix={GRAYSCALE_MATRIX} />
    </Path>
  );
}
