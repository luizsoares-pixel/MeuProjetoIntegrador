import { MaterialCommunityIcons } from "@expo/vector-icons";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  RegisterRestaurantInput,
  registerRestaurantSchema,
} from "@menu-digital/contracts";
import { LinearGradient } from "expo-linear-gradient";
import * as Location from "expo-location";
import { router } from "expo-router";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "../components/Button";
import { CustomModal } from "../components/CustomModal";
import { Input } from "../components/Input";
import { useAuth } from "../hooks/useAuth";
import { registerRestaurant } from "../services/api";
import { colors, spacing, typography } from "../theme";

const CUISINE_PRESETS = [
  "Brasileira",
  "Hamburgueria",
  "Italiana",
  "Japonesa",
  "Pizzaria",
  "Cafeteria",
  "Churrascaria",
  "Doceria",
  "Árabe",
  "Saudável",
];

export default function CadastroRestaurante() {
  const insets = useSafeAreaInsets();
  const { signIn } = useAuth();

  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState("Atenção");
  const [modalMessage, setModalMessage] = useState("");
  const [isLocatingGps, setIsLocatingGps] = useState(false);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterRestaurantInput>({
    resolver: zodResolver(registerRestaurantSchema),
    defaultValues: {
      email: "",
      password: "",
      restaurant: {
        name: "",
        address: "",
        cuisineType: "",
        phone: "",
        cnpj: "",
        latitude: undefined as unknown as number,
        longitude: undefined as unknown as number,
        imageUrl: null,
      },
    },
  });

  const selectedCuisine = watch("restaurant.cuisineType");
  const currentLat = watch("restaurant.latitude");
  const currentLng = watch("restaurant.longitude");

  async function handleGetGpsLocation() {
    setIsLocatingGps(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setModalTitle("Permissão de Localização");
        setModalMessage("Permita o acesso à localização para preencher as coordenadas automaticamente.");
        setModalVisible(true);
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const { latitude, longitude } = position.coords;
      setValue("restaurant.latitude", latitude, { shouldValidate: true });
      setValue("restaurant.longitude", longitude, { shouldValidate: true });

      // Tenta geocodificação reversa para sugerir endereço se estiver vazio
      try {
        const [geocode] = await Location.reverseGeocodeAsync({ latitude, longitude });
        if (geocode) {
          const street = geocode.street ?? geocode.name ?? "";
          const city = geocode.subregion ?? geocode.city ?? "";
          const fullAddress = [street, city].filter(Boolean).join(", ");
          if (fullAddress && !watch("restaurant.address")) {
            setValue("restaurant.address", fullAddress, { shouldValidate: true });
          }
        }
      } catch {
        // Geocoding reverso opcional
      }
    } catch {
      setModalTitle("Erro de GPS");
      setModalMessage("Não foi possível obter a sua localização atual. Insira as coordenadas manualmente.");
      setModalVisible(true);
    } finally {
      setIsLocatingGps(false);
    }
  }

  async function onSubmit(data: RegisterRestaurantInput) {
    try {
      const cleanCnpj = data.restaurant.cnpj.replace(/\D/g, "");
      const cleanPhone = data.restaurant.phone.replace(/\D/g, "");

      await registerRestaurant({
        ...data,
        restaurant: {
          ...data.restaurant,
          cnpj: cleanCnpj,
          phone: cleanPhone,
          latitude: Number(data.restaurant.latitude),
          longitude: Number(data.restaurant.longitude),
        },
      });

      const loggedIn = await signIn(data.email, data.password);
      if (!loggedIn) {
        setModalTitle("Conta Criada");
        setModalMessage("Sua conta foi criada com sucesso! Faça login para continuar.");
        setModalVisible(true);
        router.replace("/login");
        return;
      }

      router.replace("/home");
    } catch (error) {
      setModalTitle("Não foi possível cadastrar");
      setModalMessage(
        error instanceof Error ? error.message : "Ocorreu um erro inesperado ao cadastrar o restaurante."
      );
      setModalVisible(true);
    }
  }

  return (
    <LinearGradient
      colors={[
        colors.background.primary,
        colors.background.secondary,
        colors.background.tertiary,
      ]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboard}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + spacing.xxxl },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Voltar"
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.accent.gold} />
            <Text style={styles.backButtonText}>Voltar</Text>
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.title}>Criar conta de restaurante</Text>
            <Text style={styles.subtitle}>
              Cadastre seu usuário gestor e seu estabelecimento em uma única etapa.
            </Text>
          </View>

          {/* Form Card */}
          <View style={styles.formCard}>
            {/* Seção 1: Acesso */}
            <Text style={styles.sectionHeader}>DADOS DE ACESSO</Text>

            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, value } }) => (
                <Input
                  placeholder="E-mail"
                  value={value}
                  onChangeText={onChange}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  error={errors.email?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, value } }) => (
                <Input
                  placeholder="Senha (mínimo 8 caracteres)"
                  value={value}
                  onChangeText={onChange}
                  secureTextEntry
                  autoCapitalize="none"
                  error={errors.password?.message}
                />
              )}
            />

            {/* Seção 2: Restaurante */}
            <Text style={[styles.sectionHeader, { marginTop: spacing.lg }]}>
              DADOS DO RESTAURANTE
            </Text>

            <Controller
              control={control}
              name="restaurant.name"
              render={({ field: { onChange, value } }) => (
                <Input
                  placeholder="Nome do restaurante"
                  value={value}
                  onChangeText={onChange}
                  error={errors.restaurant?.name?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="restaurant.cnpj"
              render={({ field: { onChange, value } }) => (
                <Input
                  placeholder="CNPJ (14 dígitos)"
                  value={value}
                  onChangeText={onChange}
                  keyboardType="numeric"
                  error={errors.restaurant?.cnpj?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="restaurant.phone"
              render={({ field: { onChange, value } }) => (
                <Input
                  placeholder="Telefone / Celular (ex: 61999998888)"
                  value={value}
                  onChangeText={onChange}
                  keyboardType="phone-pad"
                  error={errors.restaurant?.phone?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="restaurant.address"
              render={({ field: { onChange, value } }) => (
                <Input
                  placeholder="Endereço completo"
                  value={value}
                  onChangeText={onChange}
                  error={errors.restaurant?.address?.message}
                />
              )}
            />

            {/* Tipo de Culinária */}
            <Controller
              control={control}
              name="restaurant.cuisineType"
              render={({ field: { onChange, value } }) => (
                <Input
                  placeholder="Tipo de culinária (ex: Hamburgueria, Italiana)"
                  value={value}
                  onChangeText={onChange}
                  error={errors.restaurant?.cuisineType?.message}
                />
              )}
            />

            {/* Presets rápidos de culinária */}
            <View style={styles.presetsContainer}>
              {CUISINE_PRESETS.map((item) => (
                <TouchableOpacity
                  key={item}
                  style={[
                    styles.presetChip,
                    selectedCuisine === item && styles.presetChipActive,
                  ]}
                  onPress={() => setValue("restaurant.cuisineType", item, { shouldValidate: true })}
                >
                  <Text
                    style={[
                      styles.presetChipText,
                      selectedCuisine === item && styles.presetChipTextActive,
                    ]}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Localização GPS / Coordenadas */}
            <Text style={[styles.sectionHeader, { marginTop: spacing.md }]}>LOCALIZAÇÃO</Text>

            <TouchableOpacity
              style={styles.gpsButton}
              onPress={handleGetGpsLocation}
              disabled={isLocatingGps}
              accessibilityRole="button"
              accessibilityLabel="Usar localização atual do dispositivo"
            >
              {isLocatingGps ? (
                <ActivityIndicator color={colors.accent.gold} size="small" />
              ) : (
                <MaterialCommunityIcons name="crosshairs-gps" size={20} color={colors.accent.gold} />
              )}
              <Text style={styles.gpsButtonText}>
                {isLocatingGps ? "Obtendo GPS..." : "Usar localização atual (GPS)"}
              </Text>
            </TouchableOpacity>

            <View style={styles.coordsRow}>
              <View style={styles.coordCol}>
                <Controller
                  control={control}
                  name="restaurant.latitude"
                  render={({ field: { onChange, value } }) => (
                    <Input
                      placeholder="Latitude"
                      value={value !== undefined ? String(value) : ""}
                      onChangeText={(val) => onChange(val === "" ? undefined : Number(val))}
                      keyboardType="numeric"
                      error={errors.restaurant?.latitude?.message}
                    />
                  )}
                />
              </View>
              <View style={styles.coordCol}>
                <Controller
                  control={control}
                  name="restaurant.longitude"
                  render={({ field: { onChange, value } }) => (
                    <Input
                      placeholder="Longitude"
                      value={value !== undefined ? String(value) : ""}
                      onChangeText={(val) => onChange(val === "" ? undefined : Number(val))}
                      keyboardType="numeric"
                      error={errors.restaurant?.longitude?.message}
                    />
                  )}
                />
              </View>
            </View>

            {currentLat !== undefined && currentLng !== undefined ? (
              <Text style={styles.coordsStatusText}>
                Coordenadas definidas: {Number(currentLat).toFixed(4)}, {Number(currentLng).toFixed(4)}
              </Text>
            ) : null}

            {/* Botão de Envio */}
            <View style={styles.submitButtonContainer}>
              <Button
                title="CRIAR CONTA DE RESTAURANTE"
                loading={isSubmitting}
                onPress={handleSubmit(onSubmit)}
                disabled={isSubmitting}
              />
            </View>
          </View>

          {/* Rodapé Login */}
          <TouchableOpacity
            style={styles.loginPrompt}
            onPress={() => router.replace("/login")}
          >
            <Text style={styles.loginPromptText}>
              Já possui uma conta? <Text style={styles.loginPromptLink}>Fazer login</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      <CustomModal
        visible={modalVisible}
        title={modalTitle}
        message={modalMessage}
        confirmText="OK"
        onConfirm={() => setModalVisible(false)}
        onClose={() => setModalVisible(false)}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboard: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  backButtonText: {
    color: colors.accent.gold,
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
  },
  header: {
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  title: {
    color: colors.accent.white,
    fontSize: typography.size.xxl,
    fontWeight: typography.weight.bold,
    textAlign: "center",
  },
  subtitle: {
    color: colors.accent.whiteSoft,
    fontSize: typography.size.sm,
    textAlign: "center",
    marginTop: spacing.xs,
    maxWidth: 320,
    lineHeight: 20,
  },
  formCard: {
    backgroundColor: "rgba(35, 10, 10, 0.75)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.accent.goldTintStrong,
    padding: spacing.xl,
    gap: spacing.sm,
  },
  sectionHeader: {
    color: colors.accent.gold,
    fontSize: typography.size.xs,
    fontWeight: typography.weight.bold,
    letterSpacing: 1.2,
    marginBottom: spacing.xxs,
  },
  presetsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  presetChip: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(218, 165, 32, 0.3)",
    backgroundColor: "rgba(218, 165, 32, 0.08)",
  },
  presetChipActive: {
    backgroundColor: colors.accent.gold,
    borderColor: colors.accent.gold,
  },
  presetChipText: {
    color: colors.accent.whiteSoft,
    fontSize: typography.size.xs,
  },
  presetChipTextActive: {
    color: colors.background.primary,
    fontWeight: typography.weight.bold,
  },
  gpsButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.accent.gold,
    borderRadius: 10,
    paddingVertical: spacing.sm,
    backgroundColor: "rgba(218, 165, 32, 0.12)",
    marginBottom: spacing.xs,
  },
  gpsButtonText: {
    color: colors.accent.gold,
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
  },
  coordsRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  coordCol: {
    flex: 1,
  },
  coordsStatusText: {
    color: colors.accent.goldMuted,
    fontSize: typography.size.xs,
    textAlign: "center",
  },
  submitButtonContainer: {
    marginTop: spacing.md,
  },
  loginPrompt: {
    alignItems: "center",
    marginTop: spacing.xl,
  },
  loginPromptText: {
    color: colors.accent.whiteSoft,
    fontSize: typography.size.sm,
  },
  loginPromptLink: {
    color: colors.accent.gold,
    fontWeight: typography.weight.bold,
  },
});
