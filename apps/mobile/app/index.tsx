import { MaterialCommunityIcons } from "@expo/vector-icons";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  LoginInput,
  loginSchema,
  mapAuthErrorMessage,
} from "@menu-digital/contracts";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  View,
  TouchableOpacity,
} from "react-native";
import { supabase } from "../services/supabase";
import { Button } from "../components/Button";
import { Input } from "../components/Input";
import { AuthCard } from "../components/AuthCard";

export default function Index() {
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

  async function handleLogin(formData: LoginInput) {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) {
        Alert.alert("Erro ao entrar", mapAuthErrorMessage(error.message));
        return;
      }

      router.replace("/home");
    } catch {
      Alert.alert(
        "Erro ao entrar",
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
      {/* LOGO */}
      <View style={styles.logoContainer}>
        <Text style={styles.watermarkText}>MD</Text>

        <MaterialCommunityIcons
          name="silverware-fork-knife"
          size={28}
          color="rgba(212,175,55,0.25)"
          style={styles.iconTopLeft}
        />

        <MaterialCommunityIcons
          name="book-open-page-variant"
          size={28}
          color="rgba(212,175,55,0.25)"
          style={styles.iconTopRight}
        />

        <MaterialCommunityIcons
          name="chef-hat"
          size={28}
          color="rgba(212,175,55,0.25)"
          style={styles.iconBottomLeft}
        />

        <MaterialCommunityIcons
          name="storefront"
          size={28}
          color="rgba(212,175,55,0.25)"
          style={styles.iconBottomRight}
        />

        <Text style={styles.brandTitle}>Menu</Text>
        <View style={styles.brandDivider} />
        <Text style={styles.brandSubtitle}>DIGITAL</Text>
        <Text style={styles.brandTagline}>Seu cardápio na palma da mão</Text>
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
              secureTextEntry
              value={value}
              onChangeText={onChange}
              error={errors.password?.message}
            />
          )}
        />
        <Button
          title="ENTRAR"
          loading={isSubmitting}
          onPress={handleSubmit(handleLogin)}
        />
      </AuthCard>

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
    fontSize: 140,
    fontWeight: "bold",
    color: "rgba(212,175,55,0.08)",
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
  brandTitle: {
    color: "#d4af37",
    fontSize: 46,
    fontWeight: "bold",
    fontStyle: "italic",
    marginTop: 55,
    zIndex: 1,
  },
  brandDivider: {
    width: 80,
    height: 2,
    backgroundColor: "#d4af37",
    marginVertical: 8,
    zIndex: 1,
  },
  brandSubtitle: {
    color: "#FFF",
    fontSize: 16,
    letterSpacing: 8,
    zIndex: 1,
  },
  brandTagline: {
    color: "#d8c184",
    marginTop: 10,
    fontSize: 14,
    zIndex: 1,
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
