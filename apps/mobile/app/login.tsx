import { MaterialCommunityIcons } from "@expo/vector-icons";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoginInput, loginSchema } from "@menu-digital/contracts";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { Controller, useForm, useWatch } from "react-hook-form";
import { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
} from "react-native";
import { useAuth } from "../hooks/useAuth";
import { Button } from "../components/Button";
import { Input } from "../components/Input";
import { AuthCard } from "../components/AuthCard";
import { ScreenHeader } from "../components/ScreenHeader";
import { CustomModal } from "../components/CustomModal";
import { colors, spacing, typography } from "../theme";

export default function Login() {
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState("Credenciais inválidas.");
  const [showPassword, setShowPassword] = useState(false);
  const { signIn, requestPasswordRecovery } = useAuth();

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const emailValue = useWatch({ control, name: "email" });

  async function handleLogin(formData: LoginInput) {
    const success = await signIn(formData.email, formData.password);

    if (!success) {
      setModalMessage("Credenciais inválidas. Verifique e-mail e senha.");
      setModalVisible(true);
    }
  }

  async function handleForgotPassword() {
    const currentEmail = (emailValue ?? "").trim();

    if (!currentEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(currentEmail)) {
      setModalMessage("Informe um e-mail válido para recuperar a senha.");
      setModalVisible(true);
      return;
    }

    const success = await requestPasswordRecovery(currentEmail);

    setModalMessage(
      success
        ? "Se o e-mail estiver cadastrado, enviaremos as instruções de recuperação."
        : "Não foi possível enviar a recuperação de senha. Tente novamente."
    );
    setModalVisible(true);
  }

  return (
    <LinearGradient
      colors={[colors.background.primary, colors.background.secondary, colors.background.tertiary]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      {/* LOGO */}
      <View style={styles.logoContainer}>
        <Text style={styles.watermarkText}>MD</Text>

        <MaterialCommunityIcons
          name="silverware-fork-knife"
          size={28}
          color={colors.accent.goldTint}
          style={styles.iconTopLeft}
        />

        <MaterialCommunityIcons
          name="book-open-page-variant"
          size={28}
          color={colors.accent.goldTint}
          style={styles.iconTopRight}
        />

        <MaterialCommunityIcons
          name="chef-hat"
          size={28}
          color={colors.accent.goldTint}
          style={styles.iconBottomLeft}
        />

        <MaterialCommunityIcons
          name="storefront"
          size={28}
          color={colors.accent.goldTint}
          style={styles.iconBottomRight}
        />

        <ScreenHeader
          title="Menu"
          subtitle="DIGITAL"
          tagline="Seu cardápio na palma da mão"
        />
      </View>

      {/* FORM CARD */}
      <AuthCard>
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
        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              placeholder="Senha"
              secureTextEntry={!showPassword}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              autoCapitalize="none"
              error={errors.password?.message}
              rightElement={
                <TouchableOpacity
                  onPress={() => setShowPassword((prev) => !prev)}
                  activeOpacity={0.8}
                  accessibilityLabel={
                    showPassword ? "Ocultar senha" : "Mostrar senha"
                  }
                >
                  <MaterialCommunityIcons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color={colors.accent.darkRed}
                  />
                </TouchableOpacity>
              }
            />
          )}
        />

        <TouchableOpacity
          style={styles.forgotPasswordButton}
          onPress={handleForgotPassword}
          activeOpacity={0.7}
          disabled={isSubmitting}
        >
          <Text style={styles.forgotPasswordText}>Esqueci minha senha</Text>
        </TouchableOpacity>

        <Button
          title="ENTRAR"
          loading={isSubmitting}
          onPress={handleSubmit(handleLogin)}
          disabled={isSubmitting}
        />
      </AuthCard>

      <CustomModal
        visible={modalVisible}
        title="Atenção"
        message={modalMessage}
        confirmText="OK"
        onClose={() => setModalVisible(false)}
      />

      {/* FOOTER */}
      <View style={styles.footerContainer}>
        <Text style={styles.footerPromptText}>Não possui conta?</Text>
        <TouchableOpacity onPress={() => router.push("/cadastro")}>
          <Text style={styles.footerLinkText}>Cadastre-se</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-start",
    paddingTop: 120,
    paddingHorizontal: spacing.xxxl,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: spacing.xhuge,
    position: "relative",
    height: 180,
  },
  watermarkText: {
    position: "absolute",
    fontSize: typography.size.logo,
    fontWeight: typography.weight.bold,
    color: colors.accent.goldTint,
    top: 0,
  },
  iconTopLeft: {
    position: "absolute",
    top: 20,
    left: 90,
  },
  iconTopRight: {
    position: "absolute",
    top: 20,
    right: 90,
  },
  iconBottomLeft: {
    position: "absolute",
    top: 100,
    left: 70,
  },
  iconBottomRight: {
    position: "absolute",
    top: 100,
    right: 70,
  },
  forgotPasswordButton: {
    alignSelf: "center",
    marginBottom: 18,
  },
  forgotPasswordText: {
    color: colors.accent.gold,
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
  },
  footerContainer: {
    marginTop: 25,
    alignItems: "center",
  },
  footerPromptText: {
    color: colors.accent.white,
    fontSize: typography.size.sm,
  },
  footerLinkText: {
    color: colors.accent.gold,
    fontWeight: typography.weight.bold,
    marginTop: 8,
    fontSize: typography.size.md,
  },
  recoveryLink: {
    alignItems: "center",
    marginTop: 16,
  },
});
