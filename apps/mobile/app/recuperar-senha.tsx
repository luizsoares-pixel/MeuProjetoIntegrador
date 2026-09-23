import { MaterialCommunityIcons } from "@expo/vector-icons";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  PasswordRecoveryInput,
  passwordRecoverySchema,
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
  TouchableOpacity,
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

export default function RecuperarSenha() {
  const insets = useSafeAreaInsets();
  const { requestPasswordRecovery } = useAuth();
  const [feedback, setFeedback] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PasswordRecoveryInput>({
    resolver: zodResolver(passwordRecoverySchema),
    defaultValues: { email: "" },
  });

  const headerAnim = useFadeSlide({ delay: 0 });
  const footerAnim = useFadeSlide({ delay: 400 });

  async function handleRecovery({ email }: PasswordRecoveryInput) {
    const sent = await requestPasswordRecovery(email);
    setFeedback(
      sent
        ? "Link enviado! Verifique sua caixa de entrada e siga as instruções para redefinir sua senha."
        : "Não foi possível enviar o link. Tente novamente."
    );
  }

  const isSent = feedback?.startsWith("Link") ?? false;

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
              title="Recuperar acesso"
              subtitle="NOVA SENHA"
              tagline="Enviaremos as instruções por e-mail"
            />
          </Animated.View>

          <AuthCard animationDelay={200}>
            <Text style={styles.description}>
              Informe o e-mail usado no cadastro para receber o link de recuperação.
            </Text>
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  placeholder="Email"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoCorrect={false}
                  error={errors.email?.message}
                />
              )}
            />
            <Button
              title="ENVIAR LINK"
              loading={isSubmitting}
              onPress={handleSubmit(handleRecovery)}
            />
            {feedback && (
              <View
                style={isSent ? styles.feedbackSuccess : styles.feedbackError}
              >
                <MaterialCommunityIcons
                  name={isSent ? "email-check-outline" : "alert-circle-outline"}
                  size={30}
                  color={isSent ? colors.accent.successSoft : colors.accent.redLight}
                />
                <Text style={styles.feedbackTitle}>
                  {isSent ? "Link enviado" : "Não foi possível enviar"}
                </Text>
                <Text
                  style={[
                    styles.feedbackText,
                    !isSent && styles.feedbackErrorText,
                  ]}
                >
                  {feedback}
                </Text>
              </View>
            )}
          </AuthCard>

          <Animated.View style={footerAnim.animatedStyle}>
            <TouchableOpacity onPress={() => router.replace("/login")}>
              <Text style={styles.backLink}>Voltar para o login</Text>
            </TouchableOpacity>
          </Animated.View>
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
  description: {
    color: colors.accent.white,
    fontSize: typography.size.sm,
    lineHeight: 21,
    marginBottom: spacing.lg,
    textAlign: "center",
  },
  backLink: {
    color: colors.accent.gold,
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
    marginTop: spacing.xxl,
    textAlign: "center",
  },
  feedbackSuccess: {
    alignItems: "center",
    backgroundColor: "rgba(184, 230, 184, 0.08)",
    borderColor: "rgba(184, 230, 184, 0.35)",
    borderRadius: 16,
    borderWidth: 1,
    marginTop: spacing.lg,
    padding: spacing.lg,
  },
  feedbackError: {
    alignItems: "center",
    backgroundColor: "rgba(255, 176, 176, 0.08)",
    borderColor: "rgba(255, 176, 176, 0.35)",
    borderRadius: 16,
    borderWidth: 1,
    marginTop: spacing.lg,
    padding: spacing.lg,
  },
  feedbackTitle: {
    color: colors.accent.white,
    fontSize: typography.size.base,
    fontWeight: typography.weight.bold,
    marginTop: spacing.xs,
    textAlign: "center",
  },
  feedbackText: {
    color: colors.accent.successSoft,
    fontSize: typography.size.sm,
    lineHeight: 21,
    marginTop: 6,
    textAlign: "center",
  },
  feedbackErrorText: {
    color: colors.accent.redLight,
    fontSize: typography.size.sm,
    lineHeight: 21,
    marginTop: 6,
    textAlign: "center",
  },
});