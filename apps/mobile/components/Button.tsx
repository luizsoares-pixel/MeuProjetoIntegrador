import {
  StyleSheet,
  Text,
  Pressable,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { colors, spacing, typography, animations } from "../theme";
import { Loading } from "./Loading";

type Props = {
  title: string;
  loading?: boolean;
  disabled?: boolean;
  onPress: () => void;
  /** Variante visual do botão. Padrão: 'primary' */
  variant?: "primary" | "outline";
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function Button({
  title,
  loading,
  disabled,
  onPress,
  variant = "primary",
}: Props) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  function handlePressIn() {
    scale.value = withTiming(0.96, {
      duration: animations.duration.fast,
      easing: Easing.out(Easing.quad),
    });
  }

  function handlePressOut() {
    scale.value = withTiming(1, {
      duration: animations.duration.fast,
      easing: Easing.out(Easing.quad),
    });
  }

  async function handlePress() {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  }

  const isDisabled = disabled || loading;
  const isPrimary = variant === "primary";

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={isDisabled}
      style={[
        animatedStyle,
        styles.button,
        isPrimary ? styles.primaryButton : styles.outlineButton,
        isDisabled && styles.buttonDisabled,
      ]}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
    >
      {loading ? (
        <Loading color={isPrimary ? colors.accent.darkRed : colors.accent.gold} />
      ) : (
        <Text
          style={[
            styles.buttonText,
            isPrimary ? styles.primaryText : styles.outlineText,
          ]}
        >
          {title}
        </Text>
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 18,
    paddingVertical: spacing.lg,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 52,
  },

  primaryButton: {
    backgroundColor: colors.accent.goldSoft,
    elevation: 8,
    boxShadow: "0px 3px 8px rgba(181, 90, 25, 0.35)",
  },

  outlineButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: colors.accent.gold,
  },

  buttonDisabled: {
    opacity: 0.55,
  },

  buttonText: {
    fontWeight: typography.weight.bold,
    textAlign: "center",
    fontSize: typography.size.lg,
    letterSpacing: 1,
  },

  primaryText: {
    color: colors.accent.darkRed,
  },

  outlineText: {
    color: colors.accent.gold,
  },
});