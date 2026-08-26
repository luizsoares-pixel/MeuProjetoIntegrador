import { MaterialCommunityIcons } from "@expo/vector-icons";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  RegisterInput,
  mapAuthErrorMessage,
  registerSchema,
} from "@menu-digital/contracts";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../services/supabase";

export default function Cadastro() {
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function handleCadastro(formData: RegisterInput) {
    try {
      const { error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });

      if (error) {
        Alert.alert("Erro no cadastro", mapAuthErrorMessage(error.message));
        return;
      }

      Alert.alert(
        "Sucesso",
        "Usuário cadastrado com sucesso!",
        [
          {
            text: "Ir para o Login",
            onPress: () => router.replace("/"),
          },
        ]
      );
    } catch {
      Alert.alert(
        "Erro no cadastro",
        "Não foi possível conectar ao servidor. Tente novamente mais tarde."
      );
    }
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

        <Text style={styles.brandTitle}>Cadastro</Text>
        <View style={styles.brandDivider} />
        <Text style={styles.brandSubtitle}>RESTAURANTES</Text>
        <Text style={styles.brandTagline}>
          Descubra restaurantes próximos a você
        </Text>
      </View>

      {/* FORM CARD */}
      <View style={styles.formCard}>
        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              placeholder="Email"
              placeholderTextColor="#d8c184"
              value={value}
              onBlur={onBlur}
              onChangeText={onChange}
              autoCapitalize="none"
              keyboardType="email-address"
              autoCorrect={false}
              style={[
                styles.input,
                errors.email ? styles.inputError : undefined,
              ]}
            />
          )}
        />
        {errors.email && (
          <Text style={styles.errorText}>{errors.email.message}</Text>
        )}

        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              placeholder="Senha"
              placeholderTextColor="#d8c184"
              secureTextEntry
              value={value}
              onBlur={onBlur}
              onChangeText={onChange}
              autoCapitalize="none"
              style={[
                styles.input,
                errors.password ? styles.inputError : undefined,
              ]}
            />
          )}
        />
        {errors.password && (
          <Text style={styles.errorText}>{errors.password.message}</Text>
        )}

        <TouchableOpacity
          onPress={handleSubmit(handleCadastro)}
          disabled={isSubmitting}
          style={[styles.submitButton, isSubmitting && styles.buttonDisabled]}
          activeOpacity={0.8}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#4a0505" />
          ) : (
            <Text style={styles.submitButtonText}>CADASTRAR</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* FOOTER */}
      <View style={styles.footerContainer}>
        <Text style={styles.footerPromptText}>Já possui uma conta?</Text>
        <TouchableOpacity onPress={() => router.push("/")}>
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
  brandTitle: {
    color: "#d4af37",
    fontSize: 42,
    fontWeight: "bold",
    marginTop: 55,
    zIndex: 1,
  },
  brandDivider: {
    width: 100,
    height: 2,
    backgroundColor: "#d4af37",
    marginVertical: 8,
    zIndex: 1,
  },
  brandSubtitle: {
    color: "#FFF",
    fontSize: 16,
    letterSpacing: 5,
    zIndex: 1,
  },
  brandTagline: {
    color: "#d8c184",
    marginTop: 10,
    fontSize: 14,
    zIndex: 1,
  },
  formCard: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.2)",
    borderRadius: 25,
    padding: 20,
  },
  input: {
    backgroundColor: "#FFF",
    borderRadius: 15,
    paddingHorizontal: 18,
    paddingVertical: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#d4af37",
    fontSize: 15,
    color: "#1a1a1a",
  },
  inputError: {
    borderColor: "#ff6b6b",
    marginBottom: 6,
  },
  errorText: {
    color: "#ff8080",
    fontSize: 13,
    marginBottom: 12,
    marginLeft: 4,
  },
  submitButton: {
    backgroundColor: "#c4943e",
    borderRadius: 18,
    paddingVertical: 18,
    shadowColor: "#d4af37",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: "#4a0505",
    fontWeight: "bold",
    textAlign: "center",
    fontSize: 18,
    letterSpacing: 1,
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
