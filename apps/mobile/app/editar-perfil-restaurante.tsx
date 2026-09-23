import { MaterialCommunityIcons } from "@expo/vector-icons";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  MenuItemResponse,
  PaymentMethod,
  PriceRange,
  UpdateRestaurantProfileInput,
  updateRestaurantProfileSchema,
} from "@menu-digital/contracts";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "../components/Button";
import { CustomModal } from "../components/CustomModal";
import { Input } from "../components/Input";
import { MenuItemFormModal } from "../components/MenuItemFormModal";
import { useAuth } from "../hooks/useAuth";
import {
  deleteMenuItem,
  fetchRestaurantMenu,
  getRestaurantProfile,
  updateMenuItem,
  updateRestaurantProfile,
  uploadImageFromUri,
} from "../services/api";
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

const PRICE_OPTIONS: { label: string; value: PriceRange; desc: string }[] = [
  { label: "$", value: "$", desc: "Econômico" },
  { label: "$$", value: "$$", desc: "Médio" },
  { label: "$$$", value: "$$$", desc: "Sofisticado" },
];

const PAYMENT_OPTIONS: { label: string; value: PaymentMethod }[] = [
  { label: "PIX", value: "PIX" },
  { label: "Cartão de Crédito", value: "CREDIT_CARD" },
  { label: "Cartão de Débito", value: "DEBIT_CARD" },
  { label: "Dinheiro", value: "CASH" },
  { label: "Vale Refeição", value: "MEAL_VOUCHER" },
];

const DAYS_OF_WEEK = [
  { key: "monday", label: "Segunda" },
  { key: "tuesday", label: "Terça" },
  { key: "wednesday", label: "Quarta" },
  { key: "thursday", label: "Quinta" },
  { key: "friday", label: "Sexta" },
  { key: "saturday", label: "Sábado" },
  { key: "sunday", label: "Domingo" },
] as const;

export default function EditarPerfilRestaurante() {
  const insets = useSafeAreaInsets();
  const { session } = useAuth();

  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [profileNotFound, setProfileNotFound] = useState(false);
  const [isLocatingGps, setIsLocatingGps] = useState(false);
  const [isPickingPhoto, setIsPickingPhoto] = useState(false);

  // Estado para adicionar fotos adicionais
  const [newPhotoUrl, setNewPhotoUrl] = useState("");
  const [photosList, setPhotosList] = useState<string[]>([]);

  // Estado do Cardápio do Restaurante
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItemResponse[]>([]);
  const [isMenuModalVisible, setIsMenuModalVisible] = useState(false);
  const [editingMenuItem, setEditingMenuItem] = useState<MenuItemResponse | null>(null);

  // Horários de funcionamento simplificados (open/close por dia)
  const [dailyHours, setDailyHours] = useState<
    Record<string, { open: string; close: string; enabled: boolean }>
  >({
    monday: { open: "11:30", close: "23:00", enabled: true },
    tuesday: { open: "11:30", close: "23:00", enabled: true },
    wednesday: { open: "11:30", close: "23:00", enabled: true },
    thursday: { open: "11:30", close: "23:00", enabled: true },
    friday: { open: "11:30", close: "23:30", enabled: true },
    saturday: { open: "11:30", close: "23:30", enabled: true },
    sunday: { open: "12:00", close: "22:00", enabled: true },
  });

  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalMessage, setModalMessage] = useState("");
  const [modalIsSuccess, setModalIsSuccess] = useState(false);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UpdateRestaurantProfileInput>({
    resolver: zodResolver(updateRestaurantProfileSchema),
    defaultValues: {
      name: "",
      phone: "",
      cnpj: "",
      cuisineType: "",
      description: "",
      priceRange: null,
      paymentMethods: [],
      street: "",
      number: "",
      complement: "",
      neighborhood: "",
      city: "",
      state: "",
      postalCode: "",
      imageUrl: null,
      latitude: undefined,
      longitude: undefined,
    },
  });

  const selectedCuisine = watch("cuisineType");
  const selectedPriceRange = watch("priceRange");
  const selectedPaymentMethods = watch("paymentMethods") || [];
  const currentDescription = watch("description") || "";
  const latitude = watch("latitude");
  const longitude = watch("longitude");

  useEffect(() => {
    async function loadData() {
      if (!session?.access_token) {
        setIsLoadingProfile(false);
        setProfileNotFound(true);
        return;
      }

      try {
        const restaurant = await getRestaurantProfile(session.access_token);
        if (restaurant) {
          setRestaurantId(restaurant.id);
          fetchRestaurantMenu(restaurant.id)
            .then((items) => setMenuItems(items))
            .catch((err) => console.warn("Erro ao carregar cardapio:", err));

          reset({
            name: restaurant.name || "",
            phone: restaurant.phone || "",
            cnpj: restaurant.cnpj || "",
            cuisineType: restaurant.cuisineType || "",
            description: restaurant.description || "",
            priceRange: restaurant.priceRange || null,
            paymentMethods: restaurant.paymentMethods || [],
            street: restaurant.street || "",
            number: restaurant.number || "",
            complement: restaurant.complement || "",
            neighborhood: restaurant.neighborhood || "",
            city: restaurant.city || "",
            state: restaurant.state || "",
            postalCode: restaurant.postalCode || "",
            imageUrl: restaurant.imageUrl || null,
            latitude: restaurant.latitude,
            longitude: restaurant.longitude,
          });

          if (restaurant.photos && restaurant.photos.length > 0) {
            setPhotosList(restaurant.photos.map((p) => p.url));
          }

          if (restaurant.businessHours) {
            const bh = restaurant.businessHours as Record<
              string,
              { open: string; close: string }[]
            >;
            const nextHours = { ...dailyHours };
            DAYS_OF_WEEK.forEach(({ key }) => {
              if (bh[key] && bh[key].length > 0) {
                nextHours[key] = {
                  open: bh[key][0].open,
                  close: bh[key][0].close,
                  enabled: true,
                };
              } else {
                nextHours[key] = {
                  open: "11:30",
                  close: "23:00",
                  enabled: false,
                };
              }
            });
            setDailyHours(nextHours);
          }
        }
      } catch {
        setProfileNotFound(true);
      } finally {
        setIsLoadingProfile(false);
      }
    }

    loadData();
  }, [session?.access_token, reset]);

  function handleTogglePayment(method: PaymentMethod) {
    const current = selectedPaymentMethods || [];
    if (current.includes(method)) {
      setValue(
        "paymentMethods",
        current.filter((m) => m !== method),
        { shouldValidate: true }
      );
    } else {
      setValue("paymentMethods", [...current, method], {
        shouldValidate: true,
      });
    }
  }

  async function handleAddPhotoFromSource(source: "camera" | "library") {
    try {
      setIsPickingPhoto(true);

      const permissionResult =
        source === "camera"
          ? await ImagePicker.requestCameraPermissionsAsync()
          : await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        setModalTitle("Permissão necessária");
        setModalMessage(
          source === "camera"
            ? "Permita o acesso à câmera para tirar uma foto do restaurante."
            : "Permita o acesso às fotos para selecionar uma imagem do restaurante."
        );
        setModalIsSuccess(false);
        setModalVisible(true);
        return;
      }

      const pickerResult =
        source === "camera"
          ? await ImagePicker.launchCameraAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              quality: 0.8,
              allowsEditing: true,
              cameraType: ImagePicker.CameraType.back,
            })
          : await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              quality: 0.8,
              allowsEditing: true,
            });

      if (pickerResult.canceled || !pickerResult.assets?.length) {
        return;
      }

      const selectedUri = pickerResult.assets[0].uri;
      if (!selectedUri) {
        return;
      }

      if (!session?.access_token) {
        setModalTitle("Sessão necessária");
        setModalMessage("Faça login novamente para realizar upload.");
        setModalIsSuccess(false);
        setModalVisible(true);
        return;
      }

      const publicUrl = await uploadImageFromUri(
        selectedUri,
        session.access_token,
        { folder: "restaurants" }
      );

      setPhotosList((previous) => [...previous, publicUrl]);
      setModalTitle("Foto adicionada");
      setModalMessage("A imagem foi enviada com sucesso para a galeria do restaurante.");
      setModalIsSuccess(true);
      setModalVisible(true);
    } catch {
      setModalTitle("Erro ao carregar imagem");
      setModalMessage("Não foi possível acessar ou enviar a foto selecionada.");
      setModalIsSuccess(false);
      setModalVisible(true);
    } finally {
      setIsPickingPhoto(false);
    }
  }

  function handleAddPhoto() {
    const trimmed = newPhotoUrl.trim();
    if (!trimmed) return;
    if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://") && !trimmed.startsWith("file://") && !trimmed.startsWith("content://")) {
      setModalTitle("URL inválida");
      setModalMessage("A URL da foto deve começar com http://, https://, file:// ou content://");
      setModalIsSuccess(false);
      setModalVisible(true);
      return;
    }
    setPhotosList([...photosList, trimmed]);
    setNewPhotoUrl("");
  }

  function handleRemovePhoto(indexToRemove: number) {
    setPhotosList(photosList.filter((_, idx) => idx !== indexToRemove));
  }

  async function handleToggleItemAvailability(item: MenuItemResponse) {
    const token = session?.access_token || (session as any)?.token;
    if (!token) return;
    try {
      const updated = await updateMenuItem(
        item.id,
        { available: !item.available },
        token
      );
      setMenuItems((prev) =>
        prev.map((i) => (i.id === item.id ? updated : i))
      );
    } catch (err: any) {
      Alert.alert(
        "Erro",
        err?.message || "Não foi possível alterar a disponibilidade."
      );
    }
  }

  async function handleDeleteMenuItem(itemId: string) {
    const token = session?.access_token || (session as any)?.token;
    if (!token) return;
    Alert.alert(
      "Excluir item",
      "Tem certeza de que deseja remover este item do cardápio?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteMenuItem(itemId, token);
              setMenuItems((prev) => prev.filter((i) => i.id !== itemId));
            } catch (err: any) {
              Alert.alert(
                "Erro",
                err?.message || "Não foi possível remover o item."
              );
            }
          },
        },
      ]
    );
  }

  async function handleCaptureGps() {
    try {
      setIsLocatingGps(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setModalTitle("Permissão de GPS necessária");
        setModalMessage(
          "Autorize o acesso à localização para capturar sua posição atual."
        );
        setModalIsSuccess(false);
        setModalVisible(true);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setValue("latitude", location.coords.latitude, { shouldValidate: true });
      setValue("longitude", location.coords.longitude, {
        shouldValidate: true,
      });

      setModalTitle("GPS capturado");
      setModalMessage(
        `Coordenadas atualizadas: ${location.coords.latitude.toFixed(5)}, ${location.coords.longitude.toFixed(5)}`
      );
      setModalIsSuccess(true);
      setModalVisible(true);
    } catch {
      setModalTitle("Erro ao obter GPS");
      setModalMessage(
        "Não foi possível obter a localização. Verifique se o GPS está ativado."
      );
      setModalIsSuccess(false);
      setModalVisible(true);
    } finally {
      setIsLocatingGps(false);
    }
  }

  async function onSubmit(data: UpdateRestaurantProfileInput) {
    if (!session?.access_token) {
      setModalTitle("Não autenticado");
      setModalMessage("Faça login novamente para atualizar o restaurante.");
      setModalIsSuccess(false);
      setModalVisible(true);
      return;
    }

    try {
      // Monta businessHours a partir do estado dailyHours
      const formattedBusinessHours: Record<
        string,
        { open: string; close: string }[]
      > = {};
      DAYS_OF_WEEK.forEach(({ key }) => {
        if (dailyHours[key]?.enabled) {
          formattedBusinessHours[key] = [
            {
              open: dailyHours[key].open,
              close: dailyHours[key].close,
            },
          ];
        }
      });

      // Garante upload de qualquer foto local em photosList via Presigned URL
      const uploadedPhotos: string[] = [];
      for (const p of photosList) {
        if (p.startsWith("http://") || p.startsWith("https://")) {
          uploadedPhotos.push(p);
        } else {
          const publicUrl = await uploadImageFromUri(p, session.access_token, {
            folder: "restaurants",
          });
          uploadedPhotos.push(publicUrl);
        }
      }

      let finalImageUrl = data.imageUrl;
      if (
        finalImageUrl &&
        !finalImageUrl.startsWith("http://") &&
        !finalImageUrl.startsWith("https://")
      ) {
        finalImageUrl = await uploadImageFromUri(
          finalImageUrl,
          session.access_token,
          { folder: "restaurants" }
        );
      }

      const payload: UpdateRestaurantProfileInput = {
        ...data,
        imageUrl: finalImageUrl,
        businessHours: formattedBusinessHours,
        photos: uploadedPhotos,
      };

      await updateRestaurantProfile(payload, session.access_token);

      setModalTitle("Sucesso!");
      setModalMessage("Perfil do restaurante atualizado com sucesso.");
      setModalIsSuccess(true);
      setModalVisible(true);
    } catch (err: any) {
      setModalTitle("Erro ao atualizar");
      setModalMessage(err.message || "Ocorreu um erro ao salvar as alterações.");
      setModalIsSuccess(false);
      setModalVisible(true);
    }
  }

  if (isLoadingProfile) {
    return (
      <LinearGradient
        colors={[colors.background.primary, colors.background.secondary]}
        style={[styles.container, styles.centered]}
      >
        <ActivityIndicator size="large" color={colors.accent.gold} />
        <Text style={styles.loadingText}>Carregando dados do restaurante...</Text>
      </LinearGradient>
    );
  }

  if (profileNotFound) {
    return (
      <LinearGradient
        colors={[colors.background.primary, colors.background.secondary]}
        style={[styles.container, styles.centered, { padding: spacing.xl }]}
      >
        <MaterialCommunityIcons
          name="store-remove-outline"
          size={64}
          color={colors.accent.gold}
        />
        <Text style={styles.notFoundTitle}>Nenhum restaurante vinculado</Text>
        <Text style={styles.notFoundSubtitle}>
          Sua conta ainda não possui um restaurante cadastrado para gerenciar.
        </Text>
        <Button
          title="CADASTRAR RESTAURANTE"
          onPress={() => router.replace("/cadastrar-restaurante" as never)}
        />
        <View style={{ height: spacing.md }} />
        <Button
          title="VOLTAR"
          variant="outline"
          onPress={() => router.back()}
        />
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={[colors.background.primary, colors.background.secondary]}
      style={styles.container}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboard}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + spacing.xxl },
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
            <MaterialCommunityIcons
              name="arrow-left"
              size={24}
              color={colors.accent.gold}
            />
            <Text style={styles.backButtonText}>Voltar</Text>
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.title}>Perfil do Restaurante</Text>
            <Text style={styles.subtitle}>
              Edite as informações completas, fotos, horários e formas de pagamento da Issue #49
            </Text>
          </View>

          <View style={styles.formCard}>
            {/* SEÇÃO 1: DADOS BÁSICOS */}
            <Text style={styles.sectionHeader}>DADOS BÁSICOS</Text>

            <Text style={styles.subLabel}>Nome do Restaurante</Text>
            <Controller
              control={control}
              name="name"
              render={({ field: { onChange, value } }) => (
                <Input
                  placeholder="Ex: Cantina do Chef"
                  value={value || ""}
                  onChangeText={onChange}
                  error={errors.name?.message}
                />
              )}
            />

            <Text style={styles.subLabel}>CNPJ (14 dígitos)</Text>
            <Controller
              control={control}
              name="cnpj"
              render={({ field: { onChange, value } }) => (
                <Input
                  placeholder="Apenas números"
                  keyboardType="numeric"
                  maxLength={14}
                  value={value || ""}
                  onChangeText={onChange}
                  error={errors.cnpj?.message}
                />
              )}
            />

            <Text style={styles.subLabel}>Telefone / WhatsApp</Text>
            <Controller
              control={control}
              name="phone"
              render={({ field: { onChange, value } }) => (
                <Input
                  placeholder="Ex: 61988887777"
                  keyboardType="phone-pad"
                  value={value || ""}
                  onChangeText={onChange}
                  error={errors.phone?.message}
                />
              )}
            />

            <Text style={styles.subLabel}>Tipo de Culinária</Text>
            <View style={styles.presetsContainer}>
              {CUISINE_PRESETS.map((item) => (
                <Pressable
                  key={item}
                  style={[
                    styles.presetChip,
                    selectedCuisine === item && styles.presetChipActive,
                  ]}
                  onPress={() =>
                    setValue("cuisineType", item, { shouldValidate: true })
                  }
                >
                  <Text
                    style={[
                      styles.presetChipText,
                      selectedCuisine === item && styles.presetChipTextActive,
                    ]}
                  >
                    {item}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Controller
              control={control}
              name="cuisineType"
              render={({ field: { onChange, value } }) => (
                <Input
                  placeholder="Outra culinária..."
                  value={value || ""}
                  onChangeText={onChange}
                  error={errors.cuisineType?.message}
                />
              )}
            />

            {/* Descrição com contador de caracteres */}
            <View style={styles.descHeader}>
              <Text style={styles.subLabel}>Descrição do Restaurante</Text>
              <Text style={styles.charCount}>
                {(currentDescription?.length || 0)}/500
              </Text>
            </View>
            <Controller
              control={control}
              name="description"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  style={styles.textArea}
                  placeholder="Conte um pouco sobre a história, ambiente e diferenciais..."
                  placeholderTextColor={colors.accent.whiteSoft}
                  multiline
                  numberOfLines={4}
                  maxLength={500}
                  value={value || ""}
                  onChangeText={onChange}
                />
              )}
            />
            {errors.description?.message && (
              <Text style={styles.errorText}>{errors.description.message}</Text>
            )}

            {/* SEÇÃO 2: FAIXA DE PREÇO */}
            <Text style={[styles.sectionHeader, { marginTop: spacing.md }]}>
              FAIXA DE PREÇO
            </Text>
            <View style={styles.priceRow}>
              {PRICE_OPTIONS.map((opt) => (
                <Pressable
                  key={opt.value}
                  style={[
                    styles.priceButton,
                    selectedPriceRange === opt.value && styles.priceButtonActive,
                  ]}
                  onPress={() =>
                    setValue("priceRange", opt.value, { shouldValidate: true })
                  }
                >
                  <Text
                    style={[
                      styles.priceSymbol,
                      selectedPriceRange === opt.value && styles.priceSymbolActive,
                    ]}
                  >
                    {opt.label}
                  </Text>
                  <Text
                    style={[
                      styles.priceDesc,
                      selectedPriceRange === opt.value && styles.priceDescActive,
                    ]}
                  >
                    {opt.desc}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* SEÇÃO 3: FORMAS DE PAGAMENTO */}
            <Text style={[styles.sectionHeader, { marginTop: spacing.md }]}>
              FORMAS DE PAGAMENTO ACEITAS
            </Text>
            <View style={styles.chipsWrap}>
              {PAYMENT_OPTIONS.map((opt) => {
                const isSelected = selectedPaymentMethods.includes(opt.value);
                return (
                  <Pressable
                    key={opt.value}
                    style={[
                      styles.paymentChip,
                      isSelected && styles.paymentChipActive,
                    ]}
                    onPress={() => handleTogglePayment(opt.value)}
                  >
                    <MaterialCommunityIcons
                      name={isSelected ? "checkbox-marked" : "checkbox-blank-outline"}
                      size={16}
                      color={isSelected ? colors.background.primary : colors.accent.gold}
                    />
                    <Text
                      style={[
                        styles.paymentChipText,
                        isSelected && styles.paymentChipTextActive,
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* SEÇÃO 4: HORÁRIOS DE FUNCIONAMENTO */}
            <Text style={[styles.sectionHeader, { marginTop: spacing.md }]}>
              HORÁRIOS DE FUNCIONAMENTO
            </Text>
            {DAYS_OF_WEEK.map(({ key, label }) => {
              const current = dailyHours[key] || {
                open: "11:30",
                close: "23:00",
                enabled: false,
              };
              return (
                <View key={key} style={styles.dayRow}>
                  <Pressable
                    style={styles.dayToggle}
                    onPress={() =>
                      setDailyHours({
                        ...dailyHours,
                        [key]: { ...current, enabled: !current.enabled },
                      })
                    }
                  >
                    <MaterialCommunityIcons
                      name={current.enabled ? "checkbox-marked" : "checkbox-blank-outline"}
                      size={18}
                      color={current.enabled ? colors.accent.gold : colors.accent.whiteSoft}
                    />
                    <Text
                      style={[
                        styles.dayLabel,
                        current.enabled && styles.dayLabelActive,
                      ]}
                    >
                      {label}
                    </Text>
                  </Pressable>

                  {current.enabled ? (
                    <View style={styles.hoursInputsRow}>
                      <TextInput
                        style={styles.timeInput}
                        value={current.open}
                        maxLength={5}
                        onChangeText={(txt) =>
                          setDailyHours({
                            ...dailyHours,
                            [key]: { ...current, open: txt },
                          })
                        }
                        placeholder="00:00"
                        placeholderTextColor={colors.accent.whiteSoft}
                      />
                      <Text style={styles.timeSeparator}>até</Text>
                      <TextInput
                        style={styles.timeInput}
                        value={current.close}
                        maxLength={5}
                        onChangeText={(txt) =>
                          setDailyHours({
                            ...dailyHours,
                            [key]: { ...current, close: txt },
                          })
                        }
                        placeholder="00:00"
                        placeholderTextColor={colors.accent.whiteSoft}
                      />
                    </View>
                  ) : (
                    <Text style={styles.closedText}>Fechado</Text>
                  )}
                </View>
              );
            })}

            {/* SEÇÃO 5: ENDEREÇO ESTRUTURADO */}
            <Text style={[styles.sectionHeader, { marginTop: spacing.md }]}>
              ENDEREÇO E LOCALIZAÇÃO
            </Text>

            <Text style={styles.subLabel}>CEP</Text>
            <Controller
              control={control}
              name="postalCode"
              render={({ field: { onChange, value } }) => (
                <Input
                  placeholder="Ex: 70000-000"
                  value={value || ""}
                  onChangeText={onChange}
                  error={errors.postalCode?.message}
                />
              )}
            />

            <Text style={styles.subLabel}>Logradouro / Rua</Text>
            <Controller
              control={control}
              name="street"
              render={({ field: { onChange, value } }) => (
                <Input
                  placeholder="Ex: Av. Paulista"
                  value={value || ""}
                  onChangeText={onChange}
                />
              )}
            />

            <View style={styles.rowTwoCols}>
              <View style={styles.col}>
                <Text style={styles.subLabel}>Número</Text>
                <Controller
                  control={control}
                  name="number"
                  render={({ field: { onChange, value } }) => (
                    <Input
                      placeholder="Ex: 100"
                      value={value || ""}
                      onChangeText={onChange}
                    />
                  )}
                />
              </View>
              <View style={styles.col}>
                <Text style={styles.subLabel}>Complemento</Text>
                <Controller
                  control={control}
                  name="complement"
                  render={({ field: { onChange, value } }) => (
                    <Input
                      placeholder="Ex: Bloco A"
                      value={value || ""}
                      onChangeText={onChange}
                    />
                  )}
                />
              </View>
            </View>

            <View style={styles.rowTwoCols}>
              <View style={styles.col}>
                <Text style={styles.subLabel}>Bairro</Text>
                <Controller
                  control={control}
                  name="neighborhood"
                  render={({ field: { onChange, value } }) => (
                    <Input
                      placeholder="Ex: Centro"
                      value={value || ""}
                      onChangeText={onChange}
                    />
                  )}
                />
              </View>
              <View style={styles.colSmall}>
                <Text style={styles.subLabel}>UF</Text>
                <Controller
                  control={control}
                  name="state"
                  render={({ field: { onChange, value } }) => (
                    <Input
                      placeholder="DF"
                      maxLength={2}
                      value={value || ""}
                      onChangeText={(t) => onChange(t.toUpperCase())}
                    />
                  )}
                />
              </View>
            </View>

            <Text style={styles.subLabel}>Cidade</Text>
            <Controller
              control={control}
              name="city"
              render={({ field: { onChange, value } }) => (
                <Input
                  placeholder="Ex: Brasília"
                  value={value || ""}
                  onChangeText={onChange}
                />
              )}
            />

            {/* GPS */}
            <TouchableOpacity
              style={styles.gpsButton}
              onPress={handleCaptureGps}
              disabled={isLocatingGps}
            >
              {isLocatingGps ? (
                <ActivityIndicator size="small" color={colors.accent.gold} />
              ) : (
                <MaterialCommunityIcons
                  name="crosshairs-gps"
                  size={18}
                  color={colors.accent.gold}
                />
              )}
              <Text style={styles.gpsButtonText}>
                {isLocatingGps ? "Capturando posição..." : "Atualizar GPS do Restaurante"}
              </Text>
            </TouchableOpacity>
            {latitude && longitude ? (
              <Text style={styles.coordsText}>
                Lat: {latitude.toFixed(5)}, Lng: {longitude.toFixed(5)}
              </Text>
            ) : null}

            {/* SEÇÃO 6: FOTOS E REDES SOCIAIS */}
            <Text style={[styles.sectionHeader, { marginTop: spacing.md }]}>
              FOTOS E GALERIA
            </Text>

            <Text style={styles.subLabel}>URL da Imagem de Capa / Logo</Text>
            <Controller
              control={control}
              name="imageUrl"
              render={({ field: { onChange, value } }) => (
                <Input
                  placeholder="https://exemplo.com/capa.jpg"
                  value={value || ""}
                  onChangeText={onChange}
                  error={errors.imageUrl?.message}
                />
              )}
            />

            <Text style={styles.subLabel}>Galeria de Fotos Adicionais</Text>
            <View style={styles.addPhotoRow}>
              <TextInput
                style={[styles.inputField, { flex: 1 }]}
                placeholder="https://exemplo.com/foto.jpg"
                placeholderTextColor={colors.accent.whiteSoft}
                value={newPhotoUrl}
                onChangeText={setNewPhotoUrl}
              />
              <TouchableOpacity
                style={styles.addPhotoButton}
                onPress={handleAddPhoto}
              >
                <MaterialCommunityIcons name="plus" size={20} color={colors.background.primary} />
                <Text style={styles.addPhotoText}>Adicionar</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.photoActionsRow}>
              <TouchableOpacity
                style={[styles.photoActionButton, isPickingPhoto && styles.photoActionButtonDisabled]}
                onPress={() => handleAddPhotoFromSource("camera")}
                disabled={isPickingPhoto}
              >
                <MaterialCommunityIcons name="camera" size={18} color={colors.background.primary} />
                <Text style={styles.photoActionText}>Tirar foto</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.photoActionButton, isPickingPhoto && styles.photoActionButtonDisabled]}
                onPress={() => handleAddPhotoFromSource("library")}
                disabled={isPickingPhoto}
              >
                <MaterialCommunityIcons name="image-multiple" size={18} color={colors.background.primary} />
                <Text style={styles.photoActionText}>Galeria</Text>
              </TouchableOpacity>
            </View>

            {photosList.length > 0 ? (
              <View style={styles.photoListContainer}>
                {photosList.map((url, index) => (
                  <View key={index} style={styles.photoItem}>
                    <Text style={styles.photoItemText} numberOfLines={1}>
                      {url}
                    </Text>
                    <TouchableOpacity onPress={() => handleRemovePhoto(index)}>
                      <MaterialCommunityIcons name="trash-can-outline" size={20} color="#ff6b6b" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.emptyPhotosText}>Nenhuma foto adicional adicionada.</Text>
            )}

            {/* SEÇÃO 7: CARDÁPIO DO RESTAURANTE */}
            <Text style={[styles.sectionHeader, { marginTop: spacing.md }]}>
              CARDÁPIO DO RESTAURANTE
            </Text>
            <Text style={styles.sectionSubtitle}>
              Cadastre e gerencie os itens e pratos do seu cardápio com foto, preço e categoria.
            </Text>

            <View style={styles.menuHeaderActions}>
              <TouchableOpacity
                style={styles.addMenuItemBtn}
                onPress={() => {
                  setEditingMenuItem(null);
                  setIsMenuModalVisible(true);
                }}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons name="plus-circle" size={20} color={colors.background.primary} />
                <Text style={styles.addMenuItemBtnText}>Adicionar Item ao Cardápio</Text>
              </TouchableOpacity>

              {restaurantId ? (
                <TouchableOpacity
                  style={styles.viewPublicMenuBtn}
                  onPress={() => router.push(`/restaurante/${restaurantId}/cardapio` as any)}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons name="eye-outline" size={18} color={colors.accent.gold} />
                  <Text style={styles.viewPublicMenuBtnText}>Ver Cardápio</Text>
                </TouchableOpacity>
              ) : null}
            </View>

            {menuItems.length > 0 ? (
              <View style={styles.menuItemsList}>
                {menuItems.map((item) => (
                  <View key={item.id} style={styles.menuItemCard}>
                    {item.photoUrl ? (
                      <Image source={{ uri: item.photoUrl }} style={styles.menuItemThumb} contentFit="cover" />
                    ) : (
                      <View style={styles.menuItemPlaceholder}>
                        <MaterialCommunityIcons name="silverware-fork-knife" size={20} color={colors.accent.goldMuted} />
                      </View>
                    )}
                    <View style={styles.menuItemInfo}>
                      <View style={styles.menuItemTopRow}>
                        <Text style={styles.menuItemCategory}>{item.category.toUpperCase()}</Text>
                        <Pressable
                          style={[
                            styles.itemAvailabilityPill,
                            item.available ? styles.itemAvailPillGreen : styles.itemAvailPillRed,
                          ]}
                          onPress={() => handleToggleItemAvailability(item)}
                        >
                          <Text
                            style={[
                              styles.itemAvailPillText,
                              item.available ? styles.itemAvailPillTextGreen : styles.itemAvailPillTextRed,
                            ]}
                          >
                            {item.available ? "DISPONÍVEL" : "ESGOTADO"}
                          </Text>
                        </Pressable>
                      </View>
                      <Text style={styles.menuItemName} numberOfLines={1}>{item.name}</Text>
                      {item.description ? (
                        <Text style={styles.menuItemDesc} numberOfLines={2}>{item.description}</Text>
                      ) : null}
                      <Text style={styles.menuItemPrice}>
                        R$ {Number(item.price).toFixed(2).replace(".", ",")}
                      </Text>
                    </View>
                    <View style={styles.menuItemActions}>
                      <TouchableOpacity
                        style={styles.itemActionBtn}
                        onPress={() => {
                          setEditingMenuItem(item);
                          setIsMenuModalVisible(true);
                        }}
                      >
                        <MaterialCommunityIcons name="pencil-outline" size={18} color={colors.accent.gold} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.itemActionBtn}
                        onPress={() => handleDeleteMenuItem(item.id)}
                      >
                        <MaterialCommunityIcons name="trash-can-outline" size={18} color={colors.accent.redSoft} />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyMenuCard}>
                <MaterialCommunityIcons name="silverware-clean" size={32} color={colors.accent.goldMuted} />
                <Text style={styles.emptyMenuTitle}>Nenhum item cadastrado no cardápio</Text>
                <Text style={styles.emptyMenuSubtitle}>
                  Toque no botão acima para adicionar seu primeiro prato ou bebida com foto e preço!
                </Text>
              </View>
            )}

            {/* Botão de Salvar */}
            <View style={styles.submitContainer}>
              <Button
                title={isSubmitting ? "SALVANDO..." : "SALVAR ALTERAÇÕES"}
                onPress={handleSubmit(onSubmit)}
                loading={isSubmitting}
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <CustomModal
        visible={modalVisible}
        title={modalTitle}
        message={modalMessage}
        iconName={modalIsSuccess ? "check-circle-outline" : "alert-circle-outline"}
        iconColor={modalIsSuccess ? colors.accent.gold : "#ff6b6b"}
        confirmText="OK"
        onConfirm={() => {
          setModalVisible(false);
          if (modalIsSuccess) {
            router.back();
          }
        }}
        onClose={() => setModalVisible(false)}
      />

      {restaurantId ? (
        <MenuItemFormModal
          visible={isMenuModalVisible}
          restaurantId={restaurantId}
          initialItem={editingMenuItem}
          onClose={() => {
            setIsMenuModalVisible(false);
            setEditingMenuItem(null);
          }}
          onSuccess={(savedItem) => {
            if (editingMenuItem) {
              setMenuItems((prev) =>
                prev.map((it) => (it.id === savedItem.id ? savedItem : it))
              );
            } else {
              setMenuItems((prev) => [savedItem, ...prev]);
            }
          }}
        />
      ) : null}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    color: colors.accent.whiteSoft,
    fontSize: typography.size.sm,
    marginTop: spacing.md,
  },
  notFoundTitle: {
    color: colors.accent.white,
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    marginTop: spacing.md,
    textAlign: "center",
  },
  notFoundSubtitle: {
    color: colors.accent.whiteSoft,
    fontSize: typography.size.sm,
    marginTop: spacing.xs,
    marginBottom: spacing.xl,
    textAlign: "center",
    maxWidth: 300,
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
    fontSize: typography.size.xs,
    textAlign: "center",
    marginTop: spacing.xs,
    maxWidth: 340,
    lineHeight: 18,
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
  subLabel: {
    color: colors.accent.whiteSoft,
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
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
  descHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  charCount: {
    color: colors.accent.goldMuted,
    fontSize: typography.size.xs,
  },
  textArea: {
    borderWidth: 1,
    borderColor: "rgba(218, 165, 32, 0.4)",
    backgroundColor: "rgba(218, 165, 32, 0.05)",
    borderRadius: 10,
    padding: spacing.sm,
    color: colors.accent.white,
    fontSize: typography.size.sm,
    textAlignVertical: "top",
    minHeight: 90,
  },
  errorText: {
    color: "#ff6b6b",
    fontSize: typography.size.xs,
    marginTop: -4,
  },
  priceRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  priceButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "rgba(218, 165, 32, 0.4)",
    backgroundColor: "rgba(218, 165, 32, 0.08)",
    borderRadius: 10,
    paddingVertical: spacing.sm,
    alignItems: "center",
  },
  priceButtonActive: {
    backgroundColor: colors.accent.gold,
    borderColor: colors.accent.gold,
  },
  priceSymbol: {
    color: colors.accent.gold,
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
  },
  priceSymbolActive: {
    color: colors.background.primary,
  },
  priceDesc: {
    color: colors.accent.whiteSoft,
    fontSize: 10,
  },
  priceDescActive: {
    color: colors.background.primary,
    fontWeight: typography.weight.semibold,
  },
  chipsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  paymentChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderColor: "rgba(218, 165, 32, 0.4)",
    backgroundColor: "rgba(218, 165, 32, 0.08)",
    borderRadius: 8,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  paymentChipActive: {
    backgroundColor: colors.accent.gold,
    borderColor: colors.accent.gold,
  },
  paymentChipText: {
    color: colors.accent.whiteSoft,
    fontSize: typography.size.xs,
  },
  paymentChipTextActive: {
    color: colors.background.primary,
    fontWeight: typography.weight.bold,
  },
  dayRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.05)",
  },
  dayToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    width: 100,
  },
  dayLabel: {
    color: colors.accent.whiteSoft,
    fontSize: typography.size.xs,
  },
  dayLabelActive: {
    color: colors.accent.white,
    fontWeight: typography.weight.semibold,
  },
  hoursInputsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  timeInput: {
    borderWidth: 1,
    borderColor: "rgba(218, 165, 32, 0.3)",
    backgroundColor: "rgba(218, 165, 32, 0.05)",
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    color: colors.accent.white,
    fontSize: typography.size.xs,
    width: 60,
    textAlign: "center",
  },
  timeSeparator: {
    color: colors.accent.whiteSoft,
    fontSize: typography.size.xs,
  },
  closedText: {
    color: colors.accent.whiteSoft,
    fontSize: typography.size.xs,
    fontStyle: "italic",
  },
  rowTwoCols: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  col: {
    flex: 1,
  },
  colSmall: {
    width: 70,
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
    marginTop: spacing.xs,
  },
  gpsButtonText: {
    color: colors.accent.gold,
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
  },
  coordsText: {
    color: colors.accent.goldMuted,
    fontSize: typography.size.xs,
    textAlign: "center",
  },
  addPhotoRow: {
    flexDirection: "row",
    gap: spacing.xs,
    alignItems: "center",
  },
  inputField: {
    borderWidth: 1,
    borderColor: "rgba(218, 165, 32, 0.4)",
    backgroundColor: "rgba(218, 165, 32, 0.05)",
    borderRadius: 8,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    color: colors.accent.white,
    fontSize: typography.size.xs,
  },
  addPhotoButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    backgroundColor: colors.accent.gold,
    borderRadius: 8,
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.sm,
  },
  addPhotoText: {
    color: colors.background.primary,
    fontSize: typography.size.xs,
    fontWeight: typography.weight.bold,
  },
  photoActionsRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  photoActionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    backgroundColor: colors.accent.gold,
    borderRadius: 10,
    paddingVertical: spacing.sm,
  },
  photoActionButtonDisabled: {
    opacity: 0.6,
  },
  photoActionText: {
    color: colors.background.primary,
    fontWeight: typography.weight.bold,
    fontSize: typography.size.sm,
  },
  photoListContainer: {
    gap: 4,
    marginTop: 4,
  },
  photoItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  photoItemText: {
    color: colors.accent.whiteSoft,
    fontSize: typography.size.xs,
    flex: 1,
    marginRight: 8,
  },
  emptyPhotosText: {
    color: colors.accent.whiteSoft,
    fontSize: typography.size.xs,
    fontStyle: "italic",
  },
  submitContainer: {
    marginTop: spacing.lg,
  },

  // ── Seção de Cardápio ──────────────────────────────────────
  sectionSubtitle: {
    color: colors.accent.whiteLight,
    fontSize: 12,
    marginTop: -8,
    marginBottom: spacing.sm,
  },
  menuHeaderActions: {
    flexDirection: "row",
    gap: 10,
    marginBottom: spacing.sm,
  },
  addMenuItemBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.accent.gold,
    paddingVertical: 12,
    borderRadius: 10,
  },
  addMenuItemBtnText: {
    color: colors.background.primary,
    fontSize: 13,
    fontWeight: "700",
  },
  viewPublicMenuBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.accent.gold,
    backgroundColor: "rgba(230, 192, 123, 0.1)",
  },
  viewPublicMenuBtnText: {
    color: colors.accent.gold,
    fontSize: 13,
    fontWeight: "600",
  },
  menuItemsList: {
    gap: 10,
    marginBottom: spacing.md,
  },
  menuItemCard: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.accent.goldTintStrong,
    padding: 10,
    gap: 10,
    alignItems: "center",
  },
  menuItemThumb: {
    width: 64,
    height: 64,
    borderRadius: 8,
    backgroundColor: "#000",
  },
  menuItemPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 8,
    backgroundColor: "rgba(230, 192, 123, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  menuItemInfo: {
    flex: 1,
    gap: 2,
  },
  menuItemTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  menuItemCategory: {
    color: colors.accent.goldMuted,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
  },
  itemAvailabilityPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  itemAvailPillGreen: {
    backgroundColor: "rgba(76, 175, 80, 0.2)",
  },
  itemAvailPillRed: {
    backgroundColor: "rgba(239, 83, 80, 0.2)",
  },
  itemAvailPillText: {
    fontSize: 9,
    fontWeight: "700",
  },
  itemAvailPillTextGreen: {
    color: "#81C784",
  },
  itemAvailPillTextRed: {
    color: "#E57373",
  },
  menuItemName: {
    color: colors.accent.white,
    fontSize: 14,
    fontWeight: "600",
  },
  menuItemDesc: {
    color: colors.accent.whiteLight,
    fontSize: 11,
  },
  menuItemPrice: {
    color: colors.accent.gold,
    fontSize: 13,
    fontWeight: "700",
    marginTop: 2,
  },
  menuItemActions: {
    flexDirection: "column",
    gap: 6,
  },
  itemActionBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyMenuCard: {
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(230, 192, 123, 0.2)",
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    gap: 6,
    marginBottom: spacing.md,
  },
  emptyMenuTitle: {
    color: colors.accent.white,
    fontSize: 14,
    fontWeight: "600",
  },
  emptyMenuSubtitle: {
    color: colors.accent.goldMuted,
    fontSize: 12,
    textAlign: "center",
  },
});
