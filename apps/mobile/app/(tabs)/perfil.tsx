import { StyleSheet, Text, View } from "react-native";
import Animated from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useAuth } from "../../hooks/useAuth";
import { useFadeSlide } from "../../hooks/useFadeSlide";
import { Button } from "../../components/Button";
import { colors, spacing, typography } from "../../theme";

export default function PerfilTab() {
  const { user, signOut } = useAuth();

  const avatarAnim = useFadeSlide({ delay: 0, translateY: 20 });
  const infoAnim = useFadeSlide({ delay: 150, translateY: 16 });
  const buttonAnim = useFadeSlide({ delay: 280, translateY: 12 });

  // Gera iniciais do email para o avatar
  const initials = user?.email?.charAt(0).toUpperCase() ?? "U";

  return (
    <LinearGradient
      colors={[colors.background.primary, colors.background.secondary]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={styles.container}
    >
      {/* Avatar */}
      <Animated.View style={[styles.avatarContainer, avatarAnim.animatedStyle]}>
        <View style={styles.avatar}>
          <Text style={styles.avatarInitials}>{initials}</Text>
        </View>
      </Animated.View>

      {/* Info */}
      <Animated.View style={[styles.infoContainer, infoAnim.animatedStyle]}>
        <Text style={styles.title}>Seu perfil</Text>
        <Text style={styles.email}>{user?.email ?? "Usuário"}</Text>

        <View style={styles.divider} />
      </Animated.View>

      {/* Ações */}
      <Animated.View style={[styles.actionsContainer, buttonAnim.animatedStyle]}>
        <Button
          title="CADASTRAR RESTAURANTE"
          onPress={() => router.push("/cadastrar-restaurante")}
        />
        <View style={{ height: spacing.md }} />
        <Button
          title="SAIR DA CONTA"
          variant="outline"
          onPress={signOut}
        />
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xxxl,
  },
  avatarContainer: {
    marginBottom: spacing.xxxl,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.accent.goldTintStrong,
    borderWidth: 2,
    borderColor: colors.accent.gold,
    alignItems: "center",
    justifyContent: "center",
    elevation: 8,
    boxShadow: "0px 4px 8px rgba(181, 90, 25, 0.35)",
  },
  avatarInitials: {
    color: colors.accent.gold,
    fontSize: 36,
    fontWeight: typography.weight.bold,
  },
  infoContainer: {
    alignItems: "center",
    width: "100%",
    marginBottom: spacing.xxxl,
  },
  title: {
    color: colors.accent.white,
    fontSize: typography.size.xxl,
    fontWeight: typography.weight.bold,
  },
  email: {
    color: colors.accent.whiteSoft,
    fontSize: typography.size.md,
    marginTop: spacing.sm,
  },
  divider: {
    width: 60,
    height: 1,
    backgroundColor: colors.accent.goldTintStrong,
    marginTop: spacing.xxxl,
    borderRadius: 1,
  },
  actionsContainer: {
    width: "100%",
    maxWidth: 300,
  },
});
