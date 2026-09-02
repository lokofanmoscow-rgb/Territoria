import { Skia } from '@shopify/react-native-skia';

import type { MapData } from '../types/map';

// Skia-канвас не даёт per-shape onPress как react-native-svg — тач
// обрабатывается одним жестом на уровне ZoomPanMap, а какая провинция под
// пальцем определяется вручную через SkPath.contains(). Провинции — выпуклые
// ячейки Вороного и не перекрываются, так что порядок перебора не важен.
export function createProvinceHitTester(map: MapData): (x: number, y: number) => number | null {
  const compiled = map.provinces
    .map((province) => ({ id: province.id, path: Skia.Path.MakeFromSVGString(province.svgPath) }))
    .filter((entry): entry is { id: number; path: NonNullable<typeof entry.path> } => entry.path !== null);

  return function hitTest(x: number, y: number): number | null {
    for (const { id, path } of compiled) {
      if (path.contains(x, y)) return id;
    }
    return null;
  };
}
