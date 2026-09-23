import { MaterialCommunityIcons } from "@expo/vector-icons";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoginInput, loginSchema } from "@menu-digital/contracts";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { Controller, useForm, useWatch } from "react-hook-form";
import { useState } from "react";
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
import { useAuth } from "../hooks/useAuth";
import { useFadeSlide } from "../hooks/useFadeSlide";
import { Button } from "../components/Button";
import { Input } from "../components/Input";
import { AuthCard } from "../components/AuthCard";
import { ScreenHeader } from "../components/ScreenHeader";
import { CustomModal } from "../components/CustomModal";
import { colors, spacing, typography } from "../theme";

export default function Login() {
  const insets = useSafeAreaInsets();
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState("Credenciais inválidas.");
  const [showPassword, setShowPassword] = useState(false);
  const { signIn, requestPasswordRecovery } = useAuth();

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const emailValue = useWatch({ control, name: "email" });

  const logoAnim = useFadeSlide({ delay: 0 });
  const footerAnim = useFadeSlide({ delay: 400 });

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
      style={styles.gradient}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
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
          {/* LOGO */}
          <Animated.View style={[styles.logoContainer, logoAnim.animatedStyle]}>
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
          </Animated.View>

          {/* FORM CARD */}
          <AuthCard animationDelay={200}>
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
          <Animated.View style={[styles.footerContainer, footerAnim.animatedStyle]}>
            <Text style={styles.footerPromptText}>Não possui conta?</Text>
            <View style={styles.footerButtonsContainer}>
              <TouchableOpacity
                style={styles.accountButton}
                onPress={() => router.push("/cadastro")}
                accessibilityRole="button"
                accessibilityLabel="Criar conta de usuário"
              >
                <Text style={styles.footerLinkText}>Criar conta de usuário</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.accountButton, styles.restaurantButton]}
                onPress={() => router.push("/cadastro-restaurante" as never)}
                accessibilityRole="button"
                accessibilityLabel="Criar conta de restaurante"
              >
                <Text style={styles.restaurantLinkText}>Criar conta de restaurante</Text>
              </TouchableOpacity>
            </View>
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
    color: colors.accent.goldWatermark,
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
    marginBottom: spacing.lg,
  },
  forgotPasswordText: {
    color: colors.accent.gold,
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
  },
  footerContainer: {
    marginTop: spacing.xxl,
    alignItems: "center",
    gap: spacing.sm,
  },
  footerPromptText: {
    color: colors.accent.white,
    fontSize: typography.size.sm,
  },
  footerButtonsContainer: {
    width: "100%",
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  accountButton: {
    width: "100%",
    borderWidth: 1,
    borderColor: colors.accent.gold,
    borderRadius: 10,
    paddingVertical: spacing.sm,
    alignItems: "center",
  },
  restaurantButton: {
    backgroundColor: "rgba(218, 165, 32, 0.12)",
  },
  footerLinkText: {
    color: colors.accent.gold,
    fontWeight: typography.weight.bold,
    fontSize: typography.size.sm,
  },
  restaurantLinkText: {
    color: colors.accent.gold,
    fontWeight: typography.weight.semibold,
    fontSize: typography.size.sm,
  },
});
