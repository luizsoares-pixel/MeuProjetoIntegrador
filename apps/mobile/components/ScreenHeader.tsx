import Animated from "react-native-reanimated";
import { StyleSheet, Text, View } from "react-native";
import { colors, spacing, typography } from "../theme";
import { useFadeSlide } from "../hooks/useFadeSlide";

type Props = {
  title: string;
  subtitle: string;
  tagline: string;
};

export function ScreenHeader({ title, subtitle, tagline }: Props) {
  const titleAnim = useFadeSlide({ delay: 0, translateY: 16 });
  const subtitleAnim = useFadeSlide({ delay: 100, translateY: 12 });
  const taglineAnim = useFadeSlide({ delay: 200, translateY: 10 });

  return (
    <View style={styles.container}>
      <Animated.Text style={[styles.title, titleAnim.animatedStyle]}>
        {title}
      </Animated.Text>

      <View style={styles.divider} />

      <Animated.Text style={[styles.subtitle, subtitleAnim.animatedStyle]}>
        {subtitle}
      </Animated.Text>

      <Animated.Text style={[styles.tagline, taglineAnim.animatedStyle]}>
        {tagline}
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    marginBottom: spacing.xhuge,
  },

  title: {
    color: colors.accent.gold,
    fontSize: typography.size.hero,
    fontWeight: typography.weight.bold,
  },

  divider: {
    width: spacing.giant,
    height: 2,
    backgroundColor: colors.accent.gold,
    marginVertical: spacing.xs,
    borderRadius: 1,
  },

  subtitle: {
    color: colors.accent.white,
    fontSize: typography.size.base,
    letterSpacing: typography.letterSpacing.xWide,
  },

  tagline: {
    color: colors.accent.goldMuted,
    marginTop: spacing.xs,
    fontSize: typography.size.sm,
  },
});