export const animations = {
  duration: {
    fast: 200,
    normal: 300,
    slow: 500,
    entrance: 600,
  },
  easing: {
    // Valores numéricos para uso com Animated.timing
    // Para Reanimated withTiming, usar Easing diretamente no site de uso
    decelerate: 0.0,   // EasingNode.out(EasingNode.quad) — para entradas
    accelerate: 1.0,   // EasingNode.in(EasingNode.quad) — para saídas
  },
} as const;
