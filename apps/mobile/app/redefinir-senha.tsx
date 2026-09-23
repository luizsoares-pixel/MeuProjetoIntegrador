import { MaterialCommunityIcons } from "@expo/vector-icons";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ResetPasswordInput,
  resetPasswordSchema,
} from "@menu-digital/contracts";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated from "react-native-reanimated";
import { AuthCard } from "../components/AuthCard";
import { Button } from "../components/Button";
import { Input } from "../components/Input";
import { ScreenHeader } from "../components/ScreenHeader";
import { useAuth } from "../hooks/useAuth";
import { useFadeSlide } from "../hooks/useFadeSlide";
import { colors, spacing, typography } from "../theme";

export default function RedefinirSenha() {
  const insets = useSafeAreaInsets();
  const { session, updatePassword, finishPasswordRecovery } = useAuth();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  const headerAnim = useFadeSlide({ delay: 0 });
  const successAnim = useFadeSlide({ delay: 0 });

  async function handleReset(input: ResetPasswordInput) {
    const updated = await updatePassword(input);
    setIsSuccess(updated);
    setFeedback(
      updated
        ? "Senha redefinida com sucesso! Sua conta está protegida com a nova senha."
        : "Não foi possível redefinir a senha. Tente novamente."
    );
  }

  if (!session) {
    return (
      <LinearGradient
        colors={[colors.background.primary, colors.background.tertiary]}
        style={styles.gradient}
      >
        <View
          style={[
            styles.scrollContent,
            {
              paddingTop: insets.top + spacing.xl,
              paddingBottom: insets.bottom + spacing.xl,
            },
          ]}
        >
          <Text style={styles.message}>
            Este link de recuperação expirou ou já foi utilizado.
          </Text>
          <Button title="VOLTAR AO LOGIN" onPress={() => router.replace("/login")} />
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={[colors.background.primary, colors.background.secondary, colors.background.tertiary]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardContainer}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingTop: insets.top + spacing.xl,
              paddingBottom: insets.bottom + spacing.xl,
            },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          bounces={false}
        >
          <Animated.View style={[styles.header, headerAnim.animatedStyle]}>
            <ScreenHeader
              title="Redefinir senha"
              subtitle="NOVA SENHA"
              tagline="Escolha uma nova senha para sua conta"
            />
          </Animated.View>

          {feedback && isSuccess ? (
            <Animated.View style={[styles.feedbackContainer, successAnim.animatedStyle]}>
              <MaterialCommunityIcons
                name="lock-check-outline"
                size={54}
                color={colors.accent.successSoft}
              />
              <Text style={styles.feedbackTitle}>Senha redefinida</Text>
              <Text style={styles.success}>{feedback}</Text>
              <Button title="CONTINUAR" onPress={finishPasswordRecovery} />
            </Animated.View>
          ) : (
            <>
              <AuthCard animationDelay={200}>
                <Controller
                  control={control}
                  name="password"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      placeholder="Nova senha"
                      secureTextEntry
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      autoCapitalize="none"
                      error={errors.password?.message}
                    />
                  )}
                />
                <Controller
                  control={control}
                  name="confirmPassword"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      placeholder="Confirme a nova senha"
                      secureTextEntry
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      autoCapitalize="none"
                      error={errors.confirmPassword?.message}
                    />
                  )}
                />
                <Button
                  title="SALVAR NOVA SENHA"
                  loading={isSubmitting}
                  onPress={handleSubmit(handleReset)}
                />
              </AuthCard>
              {feedback && <Text style={styles.error}>{feedback}</Text>}
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: spacing.xxxl,
  },
  header: {
    alignItems: "center",
    marginBottom: spacing.xhuge,
  },
  message: {
    color: colors.accent.white,
    fontSize: typography.size.base,
    lineHeight: 24,
    marginBottom: spacing.xxxl,
    textAlign: "center",
  },
  feedbackContainer: {
    alignItems: "center",
    backgroundColor: "rgba(184, 230, 184, 0.08)",
    borderColor: "rgba(184, 230, 184, 0.35)",
    borderRadius: 18,
    borderWidth: 1,
    gap: spacing.xxxl,
    padding: spacing.xxl,
  },
  feedbackTitle: {
    color: colors.accent.white,
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    marginTop: -10,
  },
  success: {
    color: colors.accent.successSoft,
    fontSize: typography.size.base,
    lineHeight: 24,
    textAlign: "center",
  },
  error: {
    color: colors.accent.redLight,
    fontSize: typography.size.sm,
    lineHeight: 21,
    marginTop: spacing.lg,
    textAlign: "center",
  },
});