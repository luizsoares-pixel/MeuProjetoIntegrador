import { MaterialCommunityIcons } from "@expo/vector-icons";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CreateRestaurantInput,
  createRestaurantSchema,
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
  Pressable,
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
import { createRestaurant } from "../services/api";
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

export default function CadastrarRestaurante() {
  const insets = useSafeAreaInsets();
  const { session } = useAuth();

  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState("Atenção");
  const [modalMessage, setModalMessage] = useState("");
  const [modalType, setModalType] = useState<"success" | "error">("error");

  const [isLocatingGps, setIsLocatingGps] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateRestaurantInput>({
    resolver: zodResolver(createRestaurantSchema),
    defaultValues: {
      name: "",
      address: "",
      cuisineType: "",
      latitude: undefined as unknown as number,
      longitude: undefined as unknown as number,
      imageUrl: null,
    },
  });

  const latitude = watch("latitude");
  const longitude = watch("longitude");
  const selectedCuisine = watch("cuisineType");
  const currentAddress = watch("address");

  const hasCoordinates =
    typeof latitude === "number" &&
    !isNaN(latitude) &&
    typeof longitude === "number" &&
    !isNaN(longitude);

  /**
   * Captura coordenadas via GPS do dispositivo móvel
   */
  async function handleCaptureGps() {
    try {
      setIsLocatingGps(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setModalTitle("Permissão de GPS necessária");
        setModalMessage(
          "Autorize o acesso à localização nas configurações para capturar sua posição atual."
        );
        setModalType("error");
        setModalVisible(true);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const lat = Number(location.coords.latitude.toFixed(6));
      const lng = Number(location.coords.longitude.toFixed(6));

      setValue("latitude", lat, { shouldValidate: true });
      setValue("longitude", lng, { shouldValidate: true });

      // Se o endereço estiver vazio, tenta preencher via geocodificação reversa
      if (!currentAddress || currentAddress.trim() === "") {
        try {
          const reverseResults = await Location.reverseGeocodeAsync({
            latitude: lat,
            longitude: lng,
          });

          if (reverseResults.length > 0) {
            const r = reverseResults[0];
            const street = r.street ?? r.name ?? "";
            const number = r.streetNumber ? `, ${r.streetNumber}` : "";
            const district = r.district ? ` - ${r.district}` : "";
            const city = r.city ?? r.subregion ?? "";
            const state = r.region ? `, ${r.region}` : "";
            const fullAddr = `${street}${number}${district} - ${city}${state}`.trim();
            if (fullAddr.length > 5) {
              setValue("address", fullAddr, { shouldValidate: true });
            }
          }
        } catch {
          // Geocodificação reversa opcional
        }
      }
    } catch (error) {
      const msg =
        error instanceof Error
          ? error.message
          : "Não foi possível obter a localização GPS no momento.";
      setModalTitle("Erro ao obter GPS");
      setModalMessage(msg);
      setModalType("error");
      setModalVisible(true);
    } finally {
      setIsLocatingGps(false);
    }
  }

  /**
   * Converte o endereço digitado em coordenadas via Geocoding
   */
  async function handleGeocodeAddress() {
    if (!currentAddress || currentAddress.trim().length < 3) {
      setModalTitle("Endereço obrigatório");
      setModalMessage("Preencha o endereço completo antes de buscar as coordenadas.");
      setModalType("error");
      setModalVisible(true);
      return;
    }

    try {
      setIsGeocoding(true);
      const results = await Location.geocodeAsync(currentAddress.trim());

      if (!results || results.length === 0) {
        setModalTitle("Localização não encontrada");
        setModalMessage(
          "Não encontramos coordenadas para o endereço informado. Verifique o nome da rua, número e cidade."
        );
        setModalType("error");
        setModalVisible(true);
        return;
      }

      const best = results[0];
      setValue("latitude", Number(best.latitude.toFixed(6)), { shouldValidate: true });
      setValue("longitude", Number(best.longitude.toFixed(6)), { shouldValidate: true });
    } catch (error) {
      const msg =
        error instanceof Error
          ? error.message
          : "Não foi possível consultar as coordenadas do endereço.";
      setModalTitle("Falha na consulta");
      setModalMessage(msg);
      setModalType("error");
      setModalVisible(true);
    } finally {
      setIsGeocoding(false);
    }
  }

  /**
   * Envia o formulário para a API autenticada
   */
  async function onSubmit(data: CreateRestaurantInput) {
    const token = session?.access_token;

    if (!token) {
      setModalTitle("Sessão expirada");
      setModalMessage("Você precisa estar logado para cadastrar um restaurante.");
      setModalType("error");
      setModalVisible(true);
      return;
    }

    try {
      await createRestaurant(
        {
          ...data,
          latitude: Number(data.latitude),
          longitude: Number(data.longitude),
        },
        token
      );

      setModalTitle("Restaurante Cadastrado!");
      setModalMessage(
        `O restaurante "${data.name}" foi registrado com sucesso e já está disponível no mapa.`
      );
      setModalType("success");
      setModalVisible(true);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Falha de conexão ao salvar restaurante. Tente novamente.";
      setModalTitle("Erro no cadastro");
      setModalMessage(message);
      setModalType("error");
      setModalVisible(true);
    }
  }

  function handleModalConfirm() {
    setModalVisible(false);
    if (modalType === "success") {
      router.replace("/mapa");
    }
  }

  return (
    <LinearGradient
      colors={[colors.background.primary, colors.background.secondary]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={[styles.container, { paddingTop: insets.top + spacing.sm }]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* BARRA SUPERIOR / VOLTAR */}
          <View style={styles.headerBar}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
              accessibilityLabel="Voltar"
              accessibilityRole="button"
            >
              <MaterialCommunityIcons
                name="arrow-left"
                size={26}
                color={colors.accent.gold}
              />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Novo Restaurante</Text>
            <View style={styles.headerPlaceholder} />
          </View>

          <Text style={styles.subtitle}>
            Cadastre seu estabelecimento para aparecer nas buscas e no mapa do Menu Digital.
          </Text>

          {/* CARD DO FORMULÁRIO */}
          <View style={styles.formCard}>
            {/* NOME */}
            <Text style={styles.fieldLabel}>NOME DO RESTAURANTE *</Text>
            <Controller
              control={control}
              name="name"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  placeholder="Ex.: Pizzaria do Bairro"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.name?.message}
                />
              )}
            />

            {/* ENDEREÇO */}
            <Text style={styles.fieldLabel}>ENDEREÇO COMPLETO *</Text>
            <Controller
              control={control}
              name="address"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  placeholder="Ex.: Rua das Flores, 120, Asa Sul - Brasília"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.address?.message}
                />
              )}
            />

            {/* TIPO DE CULINÁRIA */}
            <Text style={styles.fieldLabel}>TIPO DE CULINÁRIA *</Text>
            <Controller
              control={control}
              name="cuisineType"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  placeholder="Ex.: Hamburgueria, Italiana..."
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.cuisineType?.message}
                />
              )}
            />

            {/* CHIPS DE SUGESTÃO DE CULINÁRIA */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipsContainer}
            >
              {CUISINE_PRESETS.map((item) => {
                const isSelected = selectedCuisine === item;
                return (
                  <Pressable
                    key={item}
                    onPress={() => setValue("cuisineType", item, { shouldValidate: true })}
                    style={[styles.chip, isSelected && styles.chipSelected]}
                  >
                    <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                      {item}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* SEÇÃO DE COORDENADAS */}
            <View style={styles.coordinatesSection}>
              <View style={styles.coordinatesHeader}>
                <MaterialCommunityIcons
                  name="map-marker-radius"
                  size={20}
                  color={colors.accent.gold}
                />
                <Text style={styles.coordinatesTitle}>LOCALIZAÇÃO NO MAPA *</Text>
              </View>

              <Text style={styles.coordinatesHint}>
                Capture as coordenadas GPS atuais ou busque a partir do endereço digitado:
              </Text>

              <View style={styles.coordsButtonsRow}>
                {/* BOTÃO GPS */}
                <TouchableOpacity
                  style={[styles.coordButton, styles.coordButtonGps]}
                  onPress={handleCaptureGps}
                  disabled={isLocatingGps || isGeocoding}
                  activeOpacity={0.8}
                >
                  {isLocatingGps ? (
                    <ActivityIndicator size="small" color={colors.background.primary} />
                  ) : (
                    <>
                      <MaterialCommunityIcons
                        name="crosshairs-gps"
                        size={18}
                        color={colors.background.primary}
                      />
                      <Text style={styles.coordButtonTextGps}>Usar GPS atual</Text>
                    </>
                  )}
                </TouchableOpacity>

                {/* BOTÃO BUSCA ENDEREÇO */}
                <TouchableOpacity
                  style={[styles.coordButton, styles.coordButtonAddress]}
                  onPress={handleGeocodeAddress}
                  disabled={isLocatingGps || isGeocoding}
                  activeOpacity={0.8}
                >
                  {isGeocoding ? (
                    <ActivityIndicator size="small" color={colors.accent.gold} />
                  ) : (
                    <>
                      <MaterialCommunityIcons
                        name="map-search"
                        size={18}
                        color={colors.accent.gold}
                      />
                      <Text style={styles.coordButtonTextAddress}>Buscar endereço</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>

              {/* STATUS DAS COORDENADAS */}
              <View
                style={[
                  styles.coordinatesBadge,
                  hasCoordinates ? styles.badgeSuccess : styles.badgePending,
                ]}
              >
                <MaterialCommunityIcons
                  name={hasCoordinates ? "check-circle" : "alert-circle-outline"}
                  size={18}
                  color={hasCoordinates ? "#22C55E" : colors.accent.whiteLight}
                />
                <Text
                  style={[
                    styles.coordinatesBadgeText,
                    hasCoordinates && styles.badgeSuccessText,
                  ]}
                >
                  {hasCoordinates
                    ? `Lat: ${latitude} | Lng: ${longitude}`
                    : "Coordenadas não capturadas ainda"}
                </Text>
              </View>

              {errors.latitude || errors.longitude ? (
                <Text style={styles.coordErrorText}>
                  {errors.latitude?.message ??
                    errors.longitude?.message ??
                    "Capture as coordenadas do restaurante."}
                </Text>
              ) : null}
            </View>

            {/* URL DA IMAGEM (OPCIONAL) */}
            <Text style={styles.fieldLabel}>FOTO / LOGO (URL OPCIONAL)</Text>
            <Controller
              control={control}
              name="imageUrl"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  placeholder="https://..."
                  value={value ?? ""}
                  onChangeText={(text) => onChange(text.trim() === "" ? null : text)}
                  onBlur={onBlur}
                  autoCapitalize="none"
                  keyboardType="url"
                  error={errors.imageUrl?.message}
                />
              )}
            />

            {/* BOTÃO SALVAR */}
            <View style={styles.submitContainer}>
              <Button
                title="CADASTRAR RESTAURANTE"
                loading={isSubmitting}
                onPress={handleSubmit(onSubmit)}
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* MODAL DE FEEDBACK */}
      <CustomModal
        visible={modalVisible}
        title={modalTitle}
        message={modalMessage}
        iconName={modalType === "success" ? "check-circle-outline" : "alert-circle-outline"}
        iconColor={modalType === "success" ? "#22C55E" : colors.accent.red}
        confirmText={modalType === "success" ? "VER NO MAPA" : "OK"}
        onConfirm={handleModalConfirm}
        onClose={() => setModalVisible(false)}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxl * 2,
  },
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.xs,
  },
  backButton: {
    padding: spacing.xs,
  },
  headerTitle: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    color: colors.accent.white,
    letterSpacing: 0.5,
  },
  headerPlaceholder: {
    width: 32,
  },
  subtitle: {
    fontSize: typography.size.sm,
    color: colors.accent.whiteLight,
    lineHeight: 20,
    marginBottom: spacing.lg,
    textAlign: "center",
    paddingHorizontal: spacing.sm,
  },
  formCard: {
    backgroundColor: "rgba(35, 10, 10, 0.70)",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.accent.goldTintStrong,
    padding: spacing.lg,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.accent.gold,
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },
  chipsContainer: {
    flexDirection: "row",
    gap: spacing.xs,
    marginBottom: spacing.lg,
    paddingVertical: spacing.xs,
  },
  chip: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "rgba(218, 165, 32, 0.25)",
  },
  chipSelected: {
    backgroundColor: colors.accent.gold,
    borderColor: colors.accent.gold,
  },
  chipText: {
    fontSize: 12,
    color: colors.accent.whiteLight,
    fontWeight: "600",
  },
  chipTextSelected: {
    color: colors.background.primary,
    fontWeight: "700",
  },
  coordinatesSection: {
    backgroundColor: "rgba(0, 0, 0, 0.25)",
    borderRadius: 14,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: "rgba(218, 165, 32, 0.20)",
    marginBottom: spacing.lg,
  },
  coordinatesHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginBottom: 4,
  },
  coordinatesTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.accent.gold,
    letterSpacing: 0.8,
  },
  coordinatesHint: {
    fontSize: 12,
    color: colors.accent.whiteLight,
    marginBottom: spacing.md,
    lineHeight: 16,
  },
  coordsButtonsRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  coordButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
  },
  coordButtonGps: {
    backgroundColor: colors.accent.gold,
  },
  coordButtonTextGps: {
    color: colors.background.primary,
    fontWeight: "700",
    fontSize: 13,
  },
  coordButtonAddress: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: colors.accent.gold,
  },
  coordButtonTextAddress: {
    color: colors.accent.gold,
    fontWeight: "700",
    fontSize: 13,
  },
  coordinatesBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingVertical: 8,
    paddingHorizontal: spacing.md,
    borderRadius: 10,
  },
  badgeSuccess: {
    backgroundColor: "rgba(34, 197, 94, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(34, 197, 94, 0.40)",
  },
  badgePending: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.10)",
  },
  coordinatesBadgeText: {
    fontSize: 12,
    color: colors.accent.whiteLight,
    fontWeight: "500",
  },
  badgeSuccessText: {
    color: "#86EFAC",
    fontWeight: "600",
  },
  coordErrorText: {
    color: colors.accent.redLight,
    fontSize: 11,
    marginTop: 6,
  },
  submitContainer: {
    marginTop: spacing.md,
  },
});
