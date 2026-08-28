import {
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from "react-native";
import { ReactNode, useCallback } from "react";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { colors, spacing, typography, animations } from "../theme";

type Props = TextInputProps & {
  error?: string;
  rightElement?: ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
};

const AnimatedView = Animated.createAnimatedComponent(View);

export function Input({
  error,
  style,
  rightElement,
  containerStyle,
  onFocus,
  onBlur,
  ...rest
}: Props) {
  const focusProgress = useSharedValue(0);

  const handleFocus = useCallback(
    (e: Parameters<NonNullable<TextInputProps["onFocus"]>>[0]) => {
      focusProgress.value = withTiming(1, {
        duration: animations.duration.normal,
        easing: Easing.out(Easing.quad),
      });
      onFocus?.(e);
    },
    [focusProgress, onFocus]
  );

  const handleBlur = useCallback(
    (e: Parameters<NonNullable<TextInputProps["onBlur"]>>[0]) => {
      focusProgress.value = withTiming(0, {
        duration: animations.duration.normal,
        easing: Easing.out(Easing.quad),
      });
      onBlur?.(e);
    },
    [focusProgress, onBlur]
  );

  const animatedBorderStyle = useAnimatedStyle(() => {
    // Interpola a cor do border: gold -> white quando focado
    // Reanimated não suporta interpolação de cor nativa sem interpolateColor,
    // então animamos a opacidade de um overlay de highlight.
    return {
      borderWidth: focusProgress.value === 1 ? 1.5 : 1,
      opacity: 1,
    };
  });

  const hasError = Boolean(error);

  return (
    <View style={[styles.wrapper, containerStyle]}>
      <AnimatedView
        style={[
          styles.inputContainer,
          hasError && styles.inputError,
          animatedBorderStyle,
        ]}
      >
        <TextInput
          placeholderTextColor={colors.accent.goldMuted}
          style={[styles.input, style]}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...rest}
        />

        {rightElement ? (
          <View style={styles.rightElement}>{rightElement}</View>
        ) : null}
      </AnimatedView>

      {hasError ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: spacing.md,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.accent.white,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: colors.accent.gold,
    overflow: "hidden",
  },
  input: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: typography.size.md,
    color: colors.accent.text,
  },
  rightElement: {
    paddingRight: spacing.sm,
    justifyContent: "center",
    alignItems: "center",
  },
  inputError: {
    borderColor: colors.accent.redSoft,
  },
  errorText: {
    color: colors.accent.redLight,
    fontSize: typography.size.xs,
    marginTop: 6,
    marginLeft: 4,
  },
});