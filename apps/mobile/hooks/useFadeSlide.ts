import { useEffect } from 'react';
import {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { animations } from '../theme';

type FadeSlideOptions = {
  /** Delay em ms antes de iniciar a animação. Padrão: 0 */
  delay?: number;
  /** Duração da animação em ms. Padrão: animations.duration.entrance (600ms) */
  duration?: number;
  /** Distância vertical do slide (positivo = vem de baixo). Padrão: 24 */
  translateY?: number;
};

/**
 * Hook de animação de entrada: fade + slide-up.
 *
 * Uso:
 *   const { animatedStyle } = useFadeSlide({ delay: 100 });
 *   <Animated.View style={animatedStyle}>...</Animated.View>
 */
export function useFadeSlide({
  delay = 0,
  duration = animations.duration.entrance,
  translateY = 24,
}: FadeSlideOptions = {}) {
  const opacity = useSharedValue(0);
  const translateYValue = useSharedValue(translateY);

  useEffect(() => {
    const easingFn = Easing.out(Easing.quad);

    opacity.value = withDelay(delay, withTiming(1, { duration, easing: easingFn }));
    translateYValue.value = withDelay(delay, withTiming(0, { duration, easing: easingFn }));
  }, [delay, duration, translateY, opacity, translateYValue]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateYValue.value }],
  }));

  return { animatedStyle };
}
