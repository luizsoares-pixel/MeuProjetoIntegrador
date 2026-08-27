import { StyleSheet, Text } from "react-native";
import Animated from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../../hooks/useAuth";
import { useFadeSlide } from "../../hooks/useFadeSlide";
import { colors, spacing, typography } from "../../theme";

export default function HomeTab() {
  const { user } = useAuth();

  const eyebrowAnim = useFadeSlide({ delay: 0, translateY: 12 });
  const titleAnim = useFadeSlide({ delay: 100, translateY: 16 });
  const descAnim = useFadeSlide({ delay: 200, translateY: 12 });
  const emailAnim = useFadeSlide({ delay: 300, translateY: 8 });

  return (
    <LinearGradient
      colors={[colors.background.primary, colors.background.secondary]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={styles.container}
    >
      <Animated.Text style={[styles.eyebrow, eyebrowAnim.animatedStyle]}>
        MENU DIGITAL
      </Animated.Text>

      <Animated.Text style={[styles.title, titleAnim.animatedStyle]}>
        Encontre seu próximo sabor
      </Animated.Text>

      <Animated.Text style={[styles.description, descAnim.animatedStyle]}>
        Restaurantes e cardápios para explorar durante a sua viagem.
      </Animated.Text>

      {user?.email ? (
        <Animated.Text style={[styles.userEmail, emailAnim.animatedStyle]}>
          {user.email}
        </Animated.Text>
      ) : null}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: spacing.xxxl,
  },
  eyebrow: {
    color: colors.accent.gold,
    fontSize: typography.size.xs,
    fontWeight: typography.weight.bold,
    letterSpacing: 2,
    marginBottom: spacing.sm,
  },
  title: {
    color: colors.accent.white,
    fontSize: 30,
    fontWeight: typography.weight.bold,
    lineHeight: 38,
    maxWidth: 320,
  },
  description: {
    color: colors.accent.whiteSoft,
    fontSize: typography.size.base,
    lineHeight: 24,
    marginTop: spacing.md,
    maxWidth: 340,
  },
  userEmail: {
    color: "rgba(255,255,255,0.48)",
    fontSize: typography.size.xs,
    marginTop: 32,
  },
});
