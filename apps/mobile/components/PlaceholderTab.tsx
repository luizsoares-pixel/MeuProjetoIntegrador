/**
 * PlaceholderTab — tela genérica para abas ainda não implementadas.
 * Mantém identidade visual consistente (gradiente + tema) sem duplicar código.
 */
import { StyleSheet, Text } from "react-native";
import Animated from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { useFadeSlide } from "../hooks/useFadeSlide";
import { colors, spacing, typography } from "../theme";

type Props = {
  title: string;
  description: string;
};

export function PlaceholderTab({ title, description }: Props) {
  const titleAnim = useFadeSlide({ delay: 0, translateY: 16 });
  const descAnim = useFadeSlide({ delay: 150, translateY: 12 });

  return (
    <LinearGradient
      colors={[colors.background.primary, colors.background.secondary]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={styles.container}
    >
      <Animated.Text style={[styles.title, titleAnim.animatedStyle]}>
        {title}
      </Animated.Text>
      <Animated.Text style={[styles.description, descAnim.animatedStyle]}>
        {description}
      </Animated.Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: spacing.xxxl,
  },
  title: {
    color: colors.accent.white,
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
  },
  description: {
    color: colors.accent.whiteSoft,
    fontSize: typography.size.base,
    lineHeight: 24,
    marginTop: spacing.sm,
  },
});
