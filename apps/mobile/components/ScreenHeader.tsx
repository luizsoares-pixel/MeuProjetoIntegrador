// components/ScreenHeader.tsx

import { StyleSheet, Text, View } from "react-native";
import { colors, spacing, typography } from "../theme";

type Props = {
  title: string;
  subtitle: string;
  tagline: string;
};

export function ScreenHeader({
  title,
  subtitle,
  tagline,
}: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>

      <View style={styles.divider} />

      <Text style={styles.subtitle}>
        {subtitle}
      </Text>

      <Text style={styles.tagline}>
        {tagline}
      </Text>
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