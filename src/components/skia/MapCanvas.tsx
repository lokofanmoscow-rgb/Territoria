import { Canvas } from '@shopify/react-native-skia';

import { parseViewBox } from '../../utils/geometry';
import MapScene, { type MapSceneProps } from './MapScene';

export type { ProvinceOwnership } from './MapScene';

// Тонкая обёртка: хостовый <Canvas> (реальный нативный вью) вокруг чистого
// дерева Skia-примитивов MapScene. Разделены, чтобы MapScene можно было
// рендерить headless (offscreen-снапшот) без поднятия настоящего RN.
export default function MapCanvas(props: MapSceneProps) {
  const { width, height } = parseViewBox(props.map.viewBox);
  return (
    <Canvas style={{ width, height }}>
      <MapScene {...props} />
    </Canvas>
  );
}
