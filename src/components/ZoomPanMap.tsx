import { useCallback, type PropsWithChildren } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

interface ZoomPanMapProps extends PropsWithChildren {
  contentWidth: number;
  contentHeight: number;
  minScale?: number;
  maxScale?: number;
  initialScale?: number;
  // Координаты в системе координат контента (те же единицы, что viewBox
  // карты) — Skia-канвас не даёт per-shape onPress как раньше react-native-svg,
  // поэтому какая провинция под пальцем, определяет уже вызывающий код.
  onTap?: (contentX: number, contentY: number) => void;
}

function clamp(value: number, min: number, max: number) {
  'worklet';
  return Math.min(Math.max(value, min), max);
}

// Карта рендерится в натуральную величину (contentWidth×contentHeight — те же
// числа, что viewBox), поэтому на телефоне она физически не помещается в
// экран целиком — как в Age of Conquest: смотришь на кусок карты и
// пинчем/пальцем ходишь по остальной.
export default function ZoomPanMap({
  contentWidth,
  contentHeight,
  minScale = 0.5,
  maxScale = 3,
  initialScale = 1,
  onTap,
  children,
}: ZoomPanMapProps) {
  const scale = useSharedValue(initialScale);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedScale = useSharedValue(initialScale);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);
  const focalX = useSharedValue(0);
  const focalY = useSharedValue(0);
  const containerWidth = useSharedValue(0);
  const containerHeight = useSharedValue(0);

  const clampTranslation = () => {
    'worklet';
    const scaledWidth = contentWidth * scale.value;
    const scaledHeight = contentHeight * scale.value;
    const minX = Math.min(0, containerWidth.value - scaledWidth);
    const maxX = Math.max(0, containerWidth.value - scaledWidth);
    const minY = Math.min(0, containerHeight.value - scaledHeight);
    const maxY = Math.max(0, containerHeight.value - scaledHeight);
    translateX.value = withTiming(clamp(translateX.value, minX, maxX));
    translateY.value = withTiming(clamp(translateY.value, minY, maxY));
  };

  const panGesture = Gesture.Pan()
    .minPointers(1)
    .maxPointers(2)
    .onStart(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    })
    .onUpdate((e) => {
      translateX.value = savedTranslateX.value + e.translationX;
      translateY.value = savedTranslateY.value + e.translationY;
    })
    .onEnd(() => {
      clampTranslation();
    });

  const pinchGesture = Gesture.Pinch()
    .onStart((e) => {
      savedScale.value = scale.value;
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
      focalX.value = e.focalX;
      focalY.value = e.focalY;
    })
    .onUpdate((e) => {
      const nextScale = clamp(savedScale.value * e.scale, minScale, maxScale);
      // якорим зум к точке под пальцами, а не к центру экрана
      const contentX = (focalX.value - savedTranslateX.value) / savedScale.value;
      const contentY = (focalY.value - savedTranslateY.value) / savedScale.value;
      translateX.value = focalX.value - contentX * nextScale;
      translateY.value = focalY.value - contentY * nextScale;
      scale.value = nextScale;
    })
    .onEnd(() => {
      clampTranslation();
    });

  // e.x/e.y жеста, навешенного на этот же Animated.View, приходят в его
  // локальных (дотрансформенных) координатах — то есть уже в тех же единицах,
  // что viewBox карты, без ручного пересчёта через scale/translate.
  const tapGesture = Gesture.Tap()
    .maxDistance(10)
    .onEnd((e) => {
      if (onTap) runOnJS(onTap)(e.x, e.y);
    });

  const composedGesture = Gesture.Simultaneous(panGesture, pinchGesture, tapGesture);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  const onLayout = useCallback(
    (e: LayoutChangeEvent) => {
      const { width, height } = e.nativeEvent.layout;
      containerWidth.value = width;
      containerHeight.value = height;
      translateX.value = (width - contentWidth * initialScale) / 2;
      translateY.value = (height - contentHeight * initialScale) / 2;
    },
    [contentWidth, contentHeight, initialScale],
  );

  return (
    <View style={styles.container} onLayout={onLayout}>
      <GestureDetector gesture={composedGesture}>
        <Animated.View style={[{ width: contentWidth, height: contentHeight }, animatedStyle]}>
          {children}
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
});
