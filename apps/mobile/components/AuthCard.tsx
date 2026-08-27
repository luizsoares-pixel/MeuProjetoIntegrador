import { ReactNode } from "react";
import { StyleSheet } from "react-native";
import Animated from "react-native-reanimated";
import { useFadeSlide } from "../hooks/useFadeSlide";
import { colors, spacing } from "../theme";

type AuthCardProps = {
  children: ReactNode;
  /** Delay de entrada em ms. Padrão: 200 */
  animationDelay?: number;
};

export function AuthCard({ children, animationDelay = 200 }: AuthCardProps) {
  const { animatedStyle } = useFadeSlide({ delay: animationDelay });

  return (
    <Animated.View style={[styles.formCard, animatedStyle]}>
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  formCard: {
    alignSelf: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
    borderRadius: 18,
    elevation: 8,
    shadowColor: colors.accent.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.24,
    shadowRadius: 16,
    maxWidth: 440,
    padding: spacing.xxl,
    width: "100%",
  },
});