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
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { AuthCard } from "../components/AuthCard";
import { Button } from "../components/Button";
import { Input } from "../components/Input";
import { ScreenHeader } from "../components/ScreenHeader";
import { useAuth } from "../contexts/AuthContext";

export default function RecuperarSenha() {
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

  async function handleRecovery({ email }: PasswordRecoveryInput) {
    const sent = await requestPasswordRecovery(email);
    setFeedback(
      sent
        ? "Link enviado! Verifique sua caixa de entrada e siga as instruções para redefinir sua senha."
        : "Não foi possível enviar o link. Tente novamente."
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
          title="Recuperar acesso"
          subtitle="NOVA SENHA"
          tagline="Enviaremos as instruções por e-mail"
        />
      </View>

      <AuthCard>
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
            style={
              feedback.startsWith("Link")
                ? styles.feedbackSuccess
                : styles.feedbackError
            }
          >
            <MaterialCommunityIcons
              name={feedback.startsWith("Link") ? "email-check-outline" : "alert-circle-outline"}
              size={30}
              color={feedback.startsWith("Link") ? "#b8e6b8" : "#ffb0b0"}
            />
            <Text style={styles.feedbackTitle}>
              {feedback.startsWith("Link") ? "Link enviado" : "Não foi possível enviar"}
            </Text>
            <Text
              style={[
                styles.feedbackText,
                !feedback.startsWith("Link") && styles.feedbackErrorText,
              ]}
            >
              {feedback}
            </Text>
          </View>
        )}
      </AuthCard>

      <TouchableOpacity onPress={() => router.replace("/login")}>
        <Text style={styles.backLink}>Voltar para o login</Text>
      </TouchableOpacity>
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
  description: {
    color: "#FFF",
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 18,
    textAlign: "center",
  },
  backLink: {
    color: "#d4af37",
    fontSize: 15,
    fontWeight: "bold",
    marginTop: 25,
    textAlign: "center",
  },
  feedbackSuccess: {
    alignItems: "center",
    backgroundColor: "rgba(184, 230, 184, 0.08)",
    borderColor: "rgba(184, 230, 184, 0.35)",
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 18,
    padding: 16,
  },
  feedbackError: {
    alignItems: "center",
    backgroundColor: "rgba(255, 176, 176, 0.08)",
    borderColor: "rgba(255, 176, 176, 0.35)",
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 18,
    padding: 16,
  },
  feedbackTitle: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 8,
    textAlign: "center",
  },
  feedbackText: {
    color: "#b8e6b8",
    fontSize: 14,
    lineHeight: 21,
    marginTop: 6,
    textAlign: "center",
  },
  feedbackErrorText: {
    color: "#ffb0b0",
    fontSize: 14,
    lineHeight: 21,
    marginTop: 16,
    textAlign: "center",
  },
});