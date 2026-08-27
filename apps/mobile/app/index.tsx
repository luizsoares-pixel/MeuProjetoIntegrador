import { StyleSheet, Text, View } from "react-native";
import Animated from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import { useFadeSlide } from "../hooks/useFadeSlide";
import { colors, spacing, typography } from "../theme";
import { Loading } from "../components/Loading";

// Tela exibida enquanto o AuthProvider resolve a sessão inicial.
// O redirecionamento é responsabilidade do RootNavigator em _layout.tsx.
export default function AppSplash() {
  const logoAnim = useFadeSlide({ delay: 0, translateY: 20 });
  const textAnim = useFadeSlide({ delay: 300, translateY: 14 });
  const loadingAnim = useFadeSlide({ delay: 600, translateY: 8 });

  return (
    <LinearGradient
      colors={[colors.background.primary, colors.background.secondary, colors.background.tertiary]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <View style={styles.content}>
        <Animated.View style={logoAnim.animatedStyle}>
          <Image
            source={require("../assets/logo.png")}
            style={styles.logo}
            contentFit="contain"
            accessibilityLabel="Logo Menu Digital"
          />
        </Animated.View>

        <Animated.View style={[styles.textBlock, textAnim.animatedStyle]}>
          <Text style={styles.title}>Menu</Text>
          <View style={styles.divider} />
          <Text style={styles.subtitle}>DIGITAL</Text>
          <Text style={styles.tagline}>Seu cardápio na palma da mão</Text>
        </Animated.View>
      </View>

      <Animated.View style={[styles.loadingContainer, loadingAnim.animatedStyle]}>
        <Loading color={colors.accent.gold} size="large" />
        <Text style={styles.loadingText}>Carregando...</Text>
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
  logo: {
    width: 160,
    height: 160,
    marginBottom: spacing.xxxl,
  },
  textBlock: {
    alignItems: "center",
  },
  title: {
    color: colors.accent.gold,
    fontSize: 48,
    fontWeight: typography.weight.bold,
    letterSpacing: 2,
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
    marginTop: 10,
    fontSize: typography.size.sm,
  },
  loadingContainer: {
    paddingBottom: 60,
    alignItems: "center",
    gap: spacing.sm,
  },
  loadingText: {
    color: colors.accent.whiteSoft,
    fontSize: typography.size.xs,
    letterSpacing: 1,
  },
});
