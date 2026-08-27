import { MaterialCommunityIcons } from "@expo/vector-icons";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  RegisterFormInput,
  registerFormSchema,
} from "@menu-digital/contracts";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { useState } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "../components/Button";
import { Input } from "../components/Input";
import { AuthCard } from "../components/AuthCard";
import { ScreenHeader } from "../components/ScreenHeader";
import { CustomModal } from "../components/CustomModal";

export default function Cadastro() {
  const { signUp } = useAuth();
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState("Atenção");
  const [modalMessage, setModalMessage] = useState(
    "Verifique os dados informados."
  );
  const [isSuccessModal, setIsSuccessModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormInput>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  async function handleCadastro(formData: RegisterFormInput) {
    const result = await signUp(formData.email, formData.password);

    if (!result.success) {
      setModalTitle("Atenção");
      setModalMessage(
        result.error ??
          "Não foi possível concluir o cadastro. Verifique os dados e tente novamente."
      );
      setIsSuccessModal(false);
      setModalVisible(true);
      return;
    }

    setModalTitle("Cadastro realizado");
    setModalMessage("Seu cadastro foi realizado com sucesso!");
    setIsSuccessModal(true);
    setModalVisible(true);
  }

  return (
    <LinearGradient
      colors={["#2f0000", "#4a0505", "#700000"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      {/* HEADER / LOGO */}
      <View style={styles.logoContainer}>
        <Text style={styles.watermarkText}>MD</Text>

        <MaterialCommunityIcons
          name="map-marker-radius"
          size={30}
          color="rgba(212,175,55,0.25)"
          style={styles.iconTopLeft}
        />

        <MaterialCommunityIcons
          name="compass-outline"
          size={30}
          color="rgba(212,175,55,0.25)"
          style={styles.iconTopRight}
        />

        <MaterialCommunityIcons
          name="store-search"
          size={30}
          color="rgba(212,175,55,0.25)"
          style={styles.iconBottomLeft}
        />

        <MaterialCommunityIcons
          name="silverware-fork-knife"
          size={30}
          color="rgba(212,175,55,0.25)"
          style={styles.iconBottomRight}
        />

        <ScreenHeader
          title="Cadastro"
          subtitle="RESTAURANTES"
          tagline="Descubra restaurantes próximos a você"
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
                    color="#4a0505"
                  />
                </TouchableOpacity>
              }
            />
          )}
        />
        <Controller
          control={control}
          name="confirmPassword"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              placeholder="Confirmar senha"
              secureTextEntry={!showConfirmPassword}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              autoCapitalize="none"
              error={errors.confirmPassword?.message}
              rightElement={
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword((prev) => !prev)}
                  activeOpacity={0.8}
                  accessibilityLabel={
                    showConfirmPassword
                      ? "Ocultar confirmação de senha"
                      : "Mostrar confirmação de senha"
                  }
                >
                  <MaterialCommunityIcons
                    name={
                      showConfirmPassword
                        ? "eye-off-outline"
                        : "eye-outline"
                    }
                    size={20}
                    color="#4a0505"
                  />
                </TouchableOpacity>
              }
            />
          )}
        />
        <Button
          title="CADASTRAR"
          loading={isSubmitting}
          onPress={handleSubmit(handleCadastro)}
        />
      </AuthCard>

      <CustomModal
        visible={modalVisible}
        title={modalTitle}
        message={modalMessage}
        confirmText={isSuccessModal ? "Ir para o login" : "OK"}
        iconName={
          isSuccessModal ? "check-circle-outline" : "information-outline"
        }
        iconColor={isSuccessModal ? "#4BB543" : "#d4af37"}
        onConfirm={() => {
          setModalVisible(false);

          if (isSuccessModal) {
            router.replace("/login");
          }
        }}
        onClose={() => {
          setModalVisible(false);

          if (isSuccessModal) {
            router.replace("/login");
          }
        }}
      />

      {/* FOOTER */}
      <View style={styles.footerContainer}>
        <Text style={styles.footerPromptText}>Já possui uma conta?</Text>
        <TouchableOpacity onPress={() => router.replace("/login")}>
          <Text style={styles.footerLinkText}>Fazer login</Text>
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
    paddingHorizontal: 24,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 50,
    position: "relative",
    height: 180,
  },
  watermarkText: {
    position: "absolute",
    fontSize: 130,
    fontWeight: "bold",
    color: "rgba(212,175,55,0.06)",
    top: 0,
    letterSpacing: 5,
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
  footerContainer: {
    marginTop: 25,
    alignItems: "center",
  },
  footerPromptText: {
    color: "#FFF",
    fontSize: 14,
  },
  footerLinkText: {
    color: "#d4af37",
    fontWeight: "bold",
    marginTop: 8,
    fontSize: 15,
  },
});
