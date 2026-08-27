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
import { StyleSheet, Text, View } from "react-native";
import { AuthCard } from "../components/AuthCard";
import { Button } from "../components/Button";
import { Input } from "../components/Input";
import { ScreenHeader } from "../components/ScreenHeader";
import { useAuth } from "../hooks/useAuth";

export default function RedefinirSenha() {
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
      <LinearGradient colors={["#2f0000", "#700000"]} style={styles.container}>
        <Text style={styles.message}>
          Este link de recuperação expirou ou já foi utilizado.
        </Text>
        <Button title="VOLTAR AO LOGIN" onPress={() => router.replace("/login")} />
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={["#2f0000", "#4a0505", "#700000"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <View style={styles.header}>
        <ScreenHeader
          title="Redefinir senha"
          subtitle="NOVA SENHA"
          tagline="Escolha uma nova senha para sua conta"
        />
      </View>

      {feedback && isSuccess ? (
        <View style={styles.feedbackContainer}>
          <MaterialCommunityIcons
            name="lock-check-outline"
            size={54}
            color="#b8e6b8"
          />
          <Text style={styles.feedbackTitle}>Senha redefinida</Text>
          <Text style={styles.success}>{feedback}</Text>
          <Button title="CONTINUAR" onPress={finishPasswordRecovery} />
        </View>
      ) : (
      <>
      <AuthCard>
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
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-start",
    paddingTop: 120,
    paddingHorizontal: 24,
  },
  header: {
    alignItems: "center",
    marginBottom: 50,
  },
  message: {
    color: "#FFF",
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 24,
    textAlign: "center",
  },
  feedbackContainer: {
    alignItems: "center",
    backgroundColor: "rgba(184, 230, 184, 0.08)",
    borderColor: "rgba(184, 230, 184, 0.35)",
    borderRadius: 18,
    borderWidth: 1,
    gap: 24,
    padding: 22,
  },
  feedbackTitle: {
    color: "#FFF",
    fontSize: 20,
    fontWeight: "bold",
    marginTop: -10,
  },
  success: {
    color: "#b8e6b8",
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
  },
  error: {
    color: "#ffb0b0",
    fontSize: 14,
    lineHeight: 21,
    marginTop: 16,
    textAlign: "center",
  },
});