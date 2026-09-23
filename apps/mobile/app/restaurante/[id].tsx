import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as Location from "expo-location";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type {
  BusinessHours,
  PaymentMethod,
  RestaurantResponse,
  ReviewResponse,
} from "@menu-digital/contracts";
import { fetchRestaurantById } from "../../services/api";
import {
  formatRouteDistance,
  formatRouteDuration,
} from "../../services/osrm";
import { useRouteCalculation } from "../../hooks/useRouteCalculation";
import { colors, spacing, typography } from "../../theme";
import { RestaurantErrorState } from "../../components/RestaurantErrorState";
import { FRIENDLY_NETWORK_ERROR_MESSAGE } from "../../constants/network";
import { useAuth } from "../../hooks/useAuth";
import { useFavorites } from "../../hooks/useFavorites";
import { FavoriteButton } from "../../components/FavoriteButton";
import { StarRating } from "../../components/StarRating";
import { RatingDistribution } from "../../components/RatingDistribution";
import { ReviewCard } from "../../components/ReviewCard";
import { ReviewModal } from "../../components/ReviewModal";
import {
  createReview,
  deleteReview,
  fetchMyReview,
  fetchRestaurantReviews,
  reportReview,
  updateReview,
} from "../../services/review.service";

import { LeafletMap } from "../../components/LeafletMap";

// ── Helpers ─────────────────────────────────────────────────────────────────────

const DAY_LABELS: Record<string, string> = {
  monday: "Segunda-feira",
  tuesday: "Terça-feira",
  wednesday: "Quarta-feira",
  thursday: "Quinta-feira",
  friday: "Sexta-feira",
  saturday: "Sábado",
  sunday: "Domingo",
};

const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  PIX: "PIX",
  CREDIT_CARD: "Cartão de Crédito",
  DEBIT_CARD: "Cartão de Débito",
  CASH: "Dinheiro",
  MEAL_VOUCHER: "Vale-Refeição",
};

const PAYMENT_ICONS: Record<PaymentMethod, React.ComponentProps<typeof MaterialCommunityIcons>["name"]> = {
  PIX: "qrcode",
  CREDIT_CARD: "credit-card",
  DEBIT_CARD: "credit-card-outline",
  CASH: "cash",
  MEAL_VOUCHER: "ticket-percent",
};

function getBusinessHoursCurrentDay(): string {
  return ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"][
    new Date().getDay()
  ];
}

function formatTimeShifts(
  hours: BusinessHours | null | undefined,
  dayKey: string
): string {
  if (!hours) return "Não informado";
  const shifts = (hours as any)[dayKey];
  if (!Array.isArray(shifts) || shifts.length === 0) return "Fechado";
  return shifts.map((s: any) => `${s.open} – ${s.close}`).join(" / ");
}

// ── Component ────────────────────────────────────────────────────────────────────

export default function RestaurantDetailsScreen() {
  const { width: screenWidth } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const galleryRef = useRef<FlatList>(null);
  const { isRestaurantFavorite, toggleRestaurant } = useFavorites();

  const [restaurant, setRestaurant] = useState<RestaurantResponse | null>(null);
  const [isLoadingRestaurant, setIsLoadingRestaurant] = useState(true);
  const [restaurantError, setRestaurantError] = useState<string | null>(null);
  const [is404, setIs404] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);

  const [userCoords, setUserCoords] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [locationStatus, setLocationStatus] = useState<
    "checking" | "granted" | "denied"
  >("checking");

  const { session } = useAuth();
  const [reviews, setReviews] = useState<ReviewResponse[]>([]);
  const [reviewsPage, setReviewsPage] = useState<number>(1);
  const [hasMoreReviews, setHasMoreReviews] = useState<boolean>(false);
  const [totalReviews, setTotalReviews] = useState<number>(0);
  const [ratingDistribution, setRatingDistribution] = useState<
    Record<number, number>
  >({
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  });
  const [isLoadingReviews, setIsLoadingReviews] = useState<boolean>(false);
  const [isLoadingMoreReviews, setIsLoadingMoreReviews] =
    useState<boolean>(false);
  const [isReviewModalVisible, setIsReviewModalVisible] =
    useState<boolean>(false);
  const [myReview, setMyReview] = useState<ReviewResponse | null>(null);

  // ── Carrega dados do restaurante ───────────────────────────────────────────
  useEffect(() => {
    let isMounted = true;
    if (!id) return;

    async function loadRestaurant() {
      setIsLoadingRestaurant(true);
      setRestaurantError(null);
      setIs404(false);

      try {
        const data = await fetchRestaurantById(id as string);
        if (isMounted) setRestaurant(data);
      } catch (err: any) {
        if (isMounted) {
          const msg: string = err?.message ?? "";
          // Detecta 404 pelo status na mensagem de erro
          if (msg.includes("404") || msg.toLowerCase().includes("não encontrado")) {
            setIs404(true);
            setRestaurantError("Restaurante não encontrado.");
          } else {
            console.warn("Erro ao carregar detalhes do restaurante:", err);
            setRestaurantError(FRIENDLY_NETWORK_ERROR_MESSAGE);
          }
        }
      } finally {
        if (isMounted) setIsLoadingRestaurant(false);
      }
    }

    loadRestaurant();
    return () => {
      isMounted = false;
    };
  }, [id, loadAttempt]);

  const retryLoadRestaurant = useCallback(() => {
    setLoadAttempt((attempt) => attempt + 1);
  }, []);

  // ── Avaliações do Restaurante (Issue #79) ───────────────────────────────────
  const loadReviews = useCallback(
    async (pageToLoad = 1, append = false) => {
      if (!id) return;
      try {
        if (append) {
          setIsLoadingMoreReviews(true);
        } else {
          setIsLoadingReviews(true);
        }

        const data = await fetchRestaurantReviews(id as string, pageToLoad, 5);

        setReviews((prev) => (append ? [...prev, ...data.reviews] : data.reviews));
        setReviewsPage(data.pagination.page);
        setHasMoreReviews(data.pagination.hasMore);
        setTotalReviews(data.totalReviews);
        if (data.ratingDistribution) {
          setRatingDistribution(data.ratingDistribution);
        }
      } catch {
        // Falha silenciosa em avaliações secundárias
      } finally {
        setIsLoadingReviews(false);
        setIsLoadingMoreReviews(false);
      }
    },
    [id]
  );

  useEffect(() => {
    loadReviews(1, false);
  }, [loadReviews]);

  const handleOpenReviewModal = async () => {
    const token = session?.access_token || (session as any)?.token;
    if (!token) {
      Alert.alert(
        "Login necessário",
        "Faça login na sua conta para avaliar este restaurante."
      );
      return;
    }

    if (id) {
      try {
        const existing = await fetchMyReview(token, {
          restaurantId: id as string,
        });
        setMyReview(existing);
      } catch {
        // Ignora erro
      }
    }

    setIsReviewModalVisible(true);
  };

  const handleReviewSubmit = async (data: any) => {
    const token = session?.access_token || (session as any)?.token;
    if (!token || !id) return;

    if (myReview) {
      await updateReview(myReview.id, data, token);
      Alert.alert(
        "Avaliação atualizada",
        "Sua avaliação foi atualizada com sucesso!"
      );
    } else {
      await createReview({ ...data, restaurantId: id as string }, token);
      Alert.alert(
        "Avaliação enviada",
        "Obrigado por avaliar este restaurante!"
      );
    }

    setMyReview(null);
    retryLoadRestaurant();
    loadReviews(1, false);
  };

  const handleDeleteReview = async () => {
    const token = session?.access_token || (session as any)?.token;
    if (!token || !myReview) return;

    await deleteReview(myReview.id, token);
    Alert.alert(
      "Avaliação excluída",
      "Sua avaliação foi excluída com sucesso."
    );
    setMyReview(null);
    retryLoadRestaurant();
    loadReviews(1, false);
  };

  const handleReportReview = async (reviewId: string) => {
    const token = session?.access_token || (session as any)?.token;
    if (!token) {
      Alert.alert(
        "Login necessário",
        "Faça login para denunciar uma avaliação."
      );
      return;
    }

    try {
      await reportReview(reviewId, "Conteúdo inadequado ou ofensivo.", token);
      Alert.alert(
        "Denúncia enviada",
        "Agradecemos o aviso. Nossa equipe analisará a denúncia."
      );
    } catch (err: any) {
      Alert.alert(
        "Erro",
        err?.message || "Não foi possível registrar a denúncia."
      );
    }
  };

  const handleLoadMoreReviews = () => {
    if (!isLoadingMoreReviews && hasMoreReviews) {
      loadReviews(reviewsPage + 1, true);
    }
  };

  // ── Geolocalização do usuário para cálculo de rota (HU9) ──────────────────
  const checkUserLocation = useCallback(async () => {
    try {
      const perm = await Location.getForegroundPermissionsAsync();
      if (perm.status === "granted") {
        setLocationStatus("granted");
        const loc =
          (await Location.getLastKnownPositionAsync({})) ||
          (await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          }));
        if (loc) {
          setUserCoords({
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          });
        }
      } else {
        setLocationStatus("denied");
      }
    } catch {
      setLocationStatus("denied");
    }
  }, []);

  useEffect(() => {
    checkUserLocation();
  }, [checkUserLocation]);

  const requestLocationPermission = async () => {
    try {
      const res = await Location.requestForegroundPermissionsAsync();
      if (res.status === "granted") {
        setLocationStatus("granted");
        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        setUserCoords({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
      } else {
        setLocationStatus("denied");
        Alert.alert(
          "Permissão Negada",
          "Ative a permissão de localização nas configurações do aparelho para calcular a rota até o restaurante."
        );
      }
    } catch {
      setLocationStatus("denied");
    }
  };

  // ── Hook de cálculo de rota OSRM (HU9) ───────────────────────────────────
  const {
    route,
    isLoading: isCalculatingRoute,
    profile,
    setProfile,
  } = useRouteCalculation({
    restaurantId: restaurant?.id,
    restaurantCoords: restaurant
      ? { latitude: restaurant.latitude, longitude: restaurant.longitude }
      : null,
    userCoords,
    enabled: Boolean(restaurant && userCoords),
  });

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleOpenPhone = () => {
    if (!restaurant?.phone) return;
    const tel = `tel:${restaurant.phone.replace(/\D/g, "")}`;
    Linking.openURL(tel).catch(() =>
      Alert.alert("Erro", "Não foi possível abrir o discador.")
    );
  };

  const handleOpenWhatsApp = () => {
    if (!restaurant?.phone) return;
    const phone = restaurant.phone.replace(/\D/g, "");
    const url = `https://wa.me/55${phone}`;
    Linking.openURL(url).catch(() =>
      Alert.alert("Erro", "Não foi possível abrir o WhatsApp.")
    );
  };

  const handleOpenInstagram = () => {
    const handle = restaurant?.socialLinks?.instagram?.replace("@", "");
    if (!handle) return;
    const url = `https://instagram.com/${handle}`;
    Linking.openURL(url).catch(() =>
      Alert.alert("Erro", "Não foi possível abrir o Instagram.")
    );
  };

  const handleOpenWebsite = () => {
    const url = restaurant?.socialLinks?.website;
    if (!url) return;
    Linking.openURL(url).catch(() =>
      Alert.alert("Erro", "Não foi possível abrir o site.")
    );
  };

  const handleOpenFacebook = () => {
    const fb = restaurant?.socialLinks?.facebook;
    if (!fb) return;
    Linking.openURL(fb).catch(() =>
      Alert.alert("Erro", "Não foi possível abrir o Facebook.")
    );
  };

  // ── Endereço formatado ──────────────────────────────────────────────────────
  const displayAddress = (() => {
    if (!restaurant) return "";
    const parts: string[] = [];
    if (restaurant.street) parts.push(restaurant.street);
    if (restaurant.number) parts.push(restaurant.number);
    if (restaurant.complement) parts.push(restaurant.complement);
    if (restaurant.neighborhood) parts.push(restaurant.neighborhood);
    if (restaurant.city) {
      const cityState = restaurant.state
        ? `${restaurant.city} - ${restaurant.state}`
        : restaurant.city;
      parts.push(cityState);
    }
    if (restaurant.postalCode) parts.push(`CEP ${restaurant.postalCode}`);
    return parts.length > 0 ? parts.join(", ") : restaurant.address || "Endereço não informado";
  })();

  // ── Galeria de fotos ────────────────────────────────────────────────────────
  const allPhotos = (() => {
    if (!restaurant) return [];
    const photos: string[] = [];
    if (restaurant.imageUrl) photos.push(restaurant.imageUrl);
    if (restaurant.photos) {
      for (const p of restaurant.photos) {
        if (p.url && !photos.includes(p.url)) {
          photos.push(p.url);
        }
      }
    }
    return photos;
  })();

  // ── Estados de Loading e Erro ───────────────────────────────────────────────
  if (isLoadingRestaurant) {
    return (
      <View style={[styles.centerContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.accent.gold} />
        <Text style={styles.loadingText}>Carregando restaurante...</Text>
      </View>
    );
  }

  if (is404) {
    return (
      <View style={[styles.centerContainer, { paddingTop: insets.top }]}>
        <MaterialCommunityIcons
          name="store-remove-outline"
          size={64}
          color={colors.accent.goldMuted}
        />
        <Text style={styles.errorTitle}>Restaurante não encontrado</Text>
        <Text style={styles.errorMessage}>
          O restaurante que você está procurando não existe ou foi removido.
        </Text>
        <TouchableOpacity style={styles.backButtonCenter} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (restaurantError || !restaurant) {
    return <RestaurantErrorState onRetry={retryLoadRestaurant} />;
  }

  const currentDay = getBusinessHoursCurrentDay();
  const todayHours = formatTimeShifts(restaurant.businessHours ?? null, currentDay);

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top,
            paddingBottom: insets.bottom + spacing.xl,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header com botão voltar ───────────────────────────────────── */}
        <View style={styles.navBar}>
          <TouchableOpacity
            style={styles.navBackButton}
            onPress={() => router.back()}
            accessibilityLabel="Voltar"
            accessibilityRole="button"
          >
            <MaterialCommunityIcons
              name="arrow-left"
              size={22}
              color={colors.accent.white}
            />
          </TouchableOpacity>
          <Text style={styles.navTitle} numberOfLines={1}>
            {restaurant.name}
          </Text>
          <View style={styles.navPlaceholder}>
            <FavoriteButton
              isFavorite={isRestaurantFavorite(restaurant.id)}
              onToggle={() => toggleRestaurant(restaurant)}
              size={22}
            />
          </View>
        </View>

        {/* ── Galeria de Fotos ─────────────────────────────────────────── */}
        {allPhotos.length > 0 ? (
          <View style={styles.galleryContainer}>
            <FlatList
              ref={galleryRef}
              data={allPhotos}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item, index) => `photo-${index}-${item}`}
              onMomentumScrollEnd={(e) => {
                const index = Math.round(
                  e.nativeEvent.contentOffset.x / screenWidth
                );
                setActivePhotoIndex(index);
              }}
              renderItem={({ item }) => (
                <Image
                  source={{ uri: item }}
                  style={[styles.galleryImage, { width: screenWidth }]}
                  contentFit="cover"
                  transition={300}
                />
              )}
            />

            {/* Indicador de páginas da galeria */}
            {allPhotos.length > 1 && (
              <View style={styles.galleryDots}>
                {allPhotos.map((_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.galleryDot,
                      i === activePhotoIndex && styles.galleryDotActive,
                    ]}
                  />
                ))}
              </View>
            )}

            {/* Badges flutuantes sobre a galeria */}
            <View style={styles.badgeRow}>
              {restaurant.rating !== null && restaurant.rating !== undefined ? (
                <View style={styles.ratingBadge}>
                  <MaterialCommunityIcons name="star" size={14} color={colors.accent.gold} />
                  <Text style={styles.ratingText}>{restaurant.rating.toFixed(1)}</Text>
                </View>
              ) : (
                <View style={styles.ratingBadge}>
                  <Text style={styles.newBadgeText}>Novo</Text>
                </View>
              )}

              {restaurant.priceRange ? (
                <View style={styles.priceBadge}>
                  <Text style={styles.priceText}>{restaurant.priceRange}</Text>
                </View>
              ) : null}

              {allPhotos.length > 1 && (
                <View style={styles.photoCountBadge}>
                  <MaterialCommunityIcons name="image-multiple" size={12} color={colors.accent.white} />
                  <Text style={styles.photoCountText}>{allPhotos.length}</Text>
                </View>
              )}
            </View>
          </View>
        ) : (
          // Placeholder quando não há fotos
          <View style={styles.imagePlaceholder}>
            <MaterialCommunityIcons
              name="silverware-fork-knife"
              size={56}
              color={colors.accent.goldMuted}
            />
            <View style={styles.badgeRowPlaceholder}>
              {restaurant.rating !== null && restaurant.rating !== undefined ? (
                <View style={styles.ratingBadge}>
                  <MaterialCommunityIcons name="star" size={14} color={colors.accent.gold} />
                  <Text style={styles.ratingText}>{restaurant.rating.toFixed(1)}</Text>
                </View>
              ) : (
                <View style={styles.ratingBadge}>
                  <Text style={styles.newBadgeText}>Novo</Text>
                </View>
              )}
              {restaurant.priceRange ? (
                <View style={styles.priceBadge}>
                  <Text style={styles.priceText}>{restaurant.priceRange}</Text>
                </View>
              ) : null}
            </View>
          </View>
        )}

        {/* ── Informações Principais ───────────────────────────────────── */}
        <View style={styles.infoSection}>
          <Text style={styles.restaurantName}>{restaurant.name}</Text>

          {restaurant.cuisineType ? (
            <View style={styles.infoRow}>
              <MaterialCommunityIcons
                name="food-variant"
                size={16}
                color={colors.accent.gold}
              />
              <Text style={styles.cuisineText}>{restaurant.cuisineType}</Text>
            </View>
          ) : null}

          {/* Endereço completo estruturado */}
          <View style={styles.infoRow}>
            <MaterialCommunityIcons
              name="map-marker-outline"
              size={18}
              color={colors.accent.goldMuted}
            />
            <Text style={styles.addressText}>{displayAddress}</Text>
          </View>

          {/* Telefone */}
          {restaurant.phone ? (
            <View style={styles.infoRow}>
              <MaterialCommunityIcons
                name="phone-outline"
                size={16}
                color={colors.accent.goldMuted}
              />
              <TouchableOpacity onPress={handleOpenPhone} activeOpacity={0.7}>
                <Text style={styles.phoneText}>{restaurant.phone}</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {/* Horário de hoje */}
          <View style={styles.infoRow}>
            <MaterialCommunityIcons
              name="clock-outline"
              size={16}
              color={colors.accent.goldMuted}
            />
            <Text style={styles.infoSubText}>
              <Text style={styles.infoLabel}>Hoje: </Text>
              {todayHours}
            </Text>
          </View>

          {/* Descrição */}
          {restaurant.description ? (
            <Text style={styles.descriptionText}>{restaurant.description}</Text>
          ) : null}
        </View>

        {/* ── Ações rápidas: Cardápio e Contato ──────────────────────────── */}
        <View style={styles.actionsRow}>
          {/* Botão Cardápio (HU11) */}
          <TouchableOpacity
            style={[styles.actionButton, styles.actionButtonPrimary]}
            onPress={() => router.push(`/restaurante/${restaurant.id}/cardapio` as any)}
            activeOpacity={0.8}
            accessibilityLabel="Ver cardápio"
            accessibilityRole="button"
          >
            <MaterialCommunityIcons
              name="book-open-variant"
              size={20}
              color={colors.background.primary}
            />
            <Text style={styles.actionButtonPrimaryText}>Ver Cardápio</Text>
          </TouchableOpacity>

          {/* Botão WhatsApp (se tiver telefone) */}
          {restaurant.phone ? (
            <TouchableOpacity
              style={[styles.actionButton, styles.actionButtonSecondary]}
              onPress={handleOpenWhatsApp}
              activeOpacity={0.8}
              accessibilityLabel="Contato via WhatsApp"
              accessibilityRole="button"
            >
              <MaterialCommunityIcons
                name="whatsapp"
                size={20}
                color={colors.accent.gold}
              />
              <Text style={styles.actionButtonSecondaryText}>WhatsApp</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* ── Redes Sociais ────────────────────────────────────────────── */}
        {(restaurant.socialLinks?.instagram ||
          restaurant.socialLinks?.facebook ||
          restaurant.socialLinks?.website) ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Redes Sociais</Text>
            <View style={styles.socialRow}>
              {restaurant.socialLinks?.instagram ? (
                <TouchableOpacity
                  style={styles.socialButton}
                  onPress={handleOpenInstagram}
                  activeOpacity={0.8}
                  accessibilityLabel="Abrir Instagram"
                  accessibilityRole="button"
                >
                  <MaterialCommunityIcons
                    name="instagram"
                    size={24}
                    color={colors.accent.gold}
                  />
                  <Text style={styles.socialLabel}>Instagram</Text>
                </TouchableOpacity>
              ) : null}

              {restaurant.socialLinks?.facebook ? (
                <TouchableOpacity
                  style={styles.socialButton}
                  onPress={handleOpenFacebook}
                  activeOpacity={0.8}
                  accessibilityLabel="Abrir Facebook"
                  accessibilityRole="button"
                >
                  <MaterialCommunityIcons
                    name="facebook"
                    size={24}
                    color={colors.accent.gold}
                  />
                  <Text style={styles.socialLabel}>Facebook</Text>
                </TouchableOpacity>
              ) : null}

              {restaurant.socialLinks?.website ? (
                <TouchableOpacity
                  style={styles.socialButton}
                  onPress={handleOpenWebsite}
                  activeOpacity={0.8}
                  accessibilityLabel="Abrir site do restaurante"
                  accessibilityRole="button"
                >
                  <MaterialCommunityIcons
                    name="web"
                    size={24}
                    color={colors.accent.gold}
                  />
                  <Text style={styles.socialLabel}>Website</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        ) : null}

        {/* ── Horários de Funcionamento ────────────────────────────────── */}
        {restaurant.businessHours ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Horários de Funcionamento</Text>
            {Object.entries(DAY_LABELS).map(([key, label]) => {
              const shifts = (restaurant.businessHours as any)?.[key];
              const isToday = key === currentDay;
              const hoursText = Array.isArray(shifts) && shifts.length > 0
                ? shifts.map((s: any) => `${s.open} – ${s.close}`).join(" / ")
                : "Fechado";

              return (
                <View
                  key={key}
                  style={[styles.hoursRow, isToday && styles.hoursRowToday]}
                >
                  <Text
                    style={[styles.hoursDay, isToday && styles.hoursDayToday]}
                  >
                    {label}
                    {isToday ? " (hoje)" : ""}
                  </Text>
                  <Text
                    style={[styles.hoursTime, isToday && styles.hoursTimeToday]}
                  >
                    {hoursText}
                  </Text>
                </View>
              );
            })}
          </View>
        ) : null}

        {/* ── Formas de Pagamento ──────────────────────────────────────── */}
        {restaurant.paymentMethods && restaurant.paymentMethods.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Formas de Pagamento</Text>
            <View style={styles.paymentGrid}>
              {restaurant.paymentMethods.map((method) => (
                <View key={method} style={styles.paymentChip}>
                  <MaterialCommunityIcons
                    name={PAYMENT_ICONS[method] ?? "cash"}
                    size={16}
                    color={colors.accent.gold}
                  />
                  <Text style={styles.paymentChipText}>
                    {PAYMENT_LABELS[method] ?? method}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {/* ── Seção HU9: Como Chegar / Rota OSRM ──────────────────────── */}
        <View style={styles.routeCard}>
          <View style={styles.routeHeader}>
            <View style={styles.routeHeaderLeft}>
              <MaterialCommunityIcons
                name="navigation-variant"
                size={22}
                color={colors.accent.gold}
              />
              <Text style={styles.routeSectionTitle}>Como Chegar</Text>
            </View>

            {/* Seletor de Perfil (Carro vs A pé) */}
            <View style={styles.profileToggle}>
              <Pressable
                style={[
                  styles.profileButton,
                  profile === "driving" && styles.profileButtonActive,
                ]}
                onPress={() => setProfile("driving")}
                accessibilityRole="button"
                accessibilityLabel="Rota de carro"
              >
                <MaterialCommunityIcons
                  name="car"
                  size={16}
                  color={
                    profile === "driving"
                      ? colors.background.primary
                      : colors.accent.whiteSoft
                  }
                />
                <Text
                  style={[
                    styles.profileButtonText,
                    profile === "driving" && styles.profileButtonTextActive,
                  ]}
                >
                  Carro
                </Text>
              </Pressable>

              <Pressable
                style={[
                  styles.profileButton,
                  profile === "walking" && styles.profileButtonActive,
                ]}
                onPress={() => setProfile("walking")}
                accessibilityRole="button"
                accessibilityLabel="Rota a pé"
              >
                <MaterialCommunityIcons
                  name="walk"
                  size={16}
                  color={
                    profile === "walking"
                      ? colors.background.primary
                      : colors.accent.whiteSoft
                  }
                />
                <Text
                  style={[
                    styles.profileButtonText,
                    profile === "walking" && styles.profileButtonTextActive,
                  ]}
                >
                  A pé
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Estado de Localização Indisponível */}
          {locationStatus === "denied" || !userCoords ? (
            <View style={styles.locationNotice}>
              <MaterialCommunityIcons
                name="map-marker-off"
                size={24}
                color={colors.accent.gold}
              />
              <Text style={styles.locationNoticeText}>
                Permita o acesso à localização para calcular o tempo estimado e a rota até este local.
              </Text>
              <TouchableOpacity
                style={styles.enableGpsButton}
                onPress={requestLocationPermission}
                activeOpacity={0.8}
              >
                <Text style={styles.enableGpsButtonText}>Ativar Localização</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {/* Informações da Rota Calculada */}
              {isCalculatingRoute ? (
                <View style={styles.calculatingRow}>
                  <ActivityIndicator size="small" color={colors.accent.gold} />
                  <Text style={styles.calculatingText}>
                    Calculando melhor rota via OSRM...
                  </Text>
                </View>
              ) : route ? (
                <View style={styles.routeStatsContainer}>
                  <View style={styles.statBox}>
                    <MaterialCommunityIcons
                      name="clock-outline"
                      size={20}
                      color={colors.accent.gold}
                    />
                    <View>
                      <Text style={styles.statLabel}>Tempo estimado</Text>
                      <Text style={styles.statValue}>
                        {formatRouteDuration(route.durationInSeconds)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.statDivider} />

                  <View style={styles.statBox}>
                    <MaterialCommunityIcons
                      name="map-marker-distance"
                      size={20}
                      color={colors.accent.gold}
                    />
                    <View>
                      <Text style={styles.statLabel}>Distância total</Text>
                      <Text style={styles.statValue}>
                        {formatRouteDistance(route.distanceInMeters)}
                      </Text>
                    </View>
                  </View>
                </View>
              ) : null}

              {/* Banner de Fallback Haversine */}
              {route?.isFallback ? (
                <View style={styles.fallbackWarning}>
                  <MaterialCommunityIcons
                    name="information-outline"
                    size={16}
                    color={colors.accent.gold}
                  />
                  <Text style={styles.fallbackWarningText}>
                    Traçado viário temporariamente indisponível. Exibindo estimativa em linha reta.
                  </Text>
                </View>
              ) : null}

              {/* Mini Mapa com Polyline e Localização do Restaurante */}
              {Platform.OS !== "web" ? (
                <View style={styles.mapContainer}>
                  <LeafletMap
                    style={styles.miniMap}
                    initialCenter={{
                      latitude: userCoords
                        ? (userCoords.latitude + restaurant.latitude) / 2
                        : restaurant.latitude,
                      longitude: userCoords
                        ? (userCoords.longitude + restaurant.longitude) / 2
                        : restaurant.longitude,
                    }}
                    initialZoom={route ? 13 : 15}
                    interactive={false}
                    userLocation={userCoords}
                    restaurants={[
                      {
                        id: restaurant.id,
                        name: restaurant.name,
                        latitude: restaurant.latitude,
                        longitude: restaurant.longitude,
                        cuisine: restaurant.cuisine,
                      },
                    ]}
                    routeCoordinates={route?.polylineCoordinates}
                  />
                </View>
              ) : null}

              {/* Botão para abrir o mapa interativo */}
              <TouchableOpacity
                style={styles.openMapButton}
                onPress={() => router.push("/mapa")}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons
                  name="map"
                  size={18}
                  color={colors.background.primary}
                />
                <Text style={styles.openMapButtonText}>Ver no Mapa Interativo</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* ── Seção de Avaliações e Reputação ─────────────────────────── */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <MaterialCommunityIcons
              name="star-circle"
              size={20}
              color={colors.accent.gold}
            />
            <Text style={styles.sectionTitle}>Avaliações e Reputação</Text>
          </View>

          <View style={styles.ratingOverviewRow}>
            <View style={styles.ratingBigScore}>
              <Text style={styles.ratingBigNumber}>
                {restaurant.rating !== null && restaurant.rating !== undefined
                  ? restaurant.rating.toFixed(1)
                  : "—"}
              </Text>
              <StarRating
                rating={restaurant.rating ?? 0}
                size={15}
              />
              <Text style={styles.ratingReviewsCount}>
                {totalReviews > 0
                  ? `${totalReviews} ${totalReviews === 1 ? "avaliação" : "avaliações"}`
                  : (restaurant.rating ? "Avaliação geral" : "Sem avaliações ainda")}
              </Text>
            </View>

            <View style={styles.ratingDistributionWrapper}>
              <RatingDistribution
                distribution={ratingDistribution}
                totalReviews={totalReviews}
              />
            </View>
          </View>

          <View style={styles.reviewActionsRow}>
            <TouchableOpacity
              style={styles.evaluateRestaurantButton}
              onPress={handleOpenReviewModal}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons
                name="star-outline"
                size={18}
                color={colors.background.primary}
              />
              <Text style={styles.evaluateRestaurantButtonText}>
                {myReview ? "Editar sua Avaliação" : "Avaliar Restaurante"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.viewMenuReviewsButton}
              onPress={() => router.push(`/restaurante/${restaurant.id}/cardapio`)}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons
                name="silverware-fork-knife"
                size={18}
                color={colors.accent.gold}
              />
              <Text style={styles.viewMenuReviewsButtonText}>
                Ver Cardápio
              </Text>
            </TouchableOpacity>
          </View>

          {/* Lista de Avaliações */}
          <View style={styles.reviewsListContainer}>
            {isLoadingReviews && reviews.length === 0 ? (
              <View style={styles.loadingReviewsBox}>
                <ActivityIndicator size="small" color={colors.accent.gold} />
                <Text style={styles.loadingReviewsText}>Carregando avaliações...</Text>
              </View>
            ) : reviews.length === 0 ? (
              <View style={styles.emptyReviewsCard}>
                <MaterialCommunityIcons
                  name="message-draw"
                  size={32}
                  color={colors.accent.whiteSoft}
                />
                <Text style={styles.emptyReviewsTitle}>Seja o primeiro a avaliar!</Text>
                <Text style={styles.emptyReviewsSubtitle}>
                  Compartilhe sua experiência gastronômica com fotos e comentários.
                </Text>
              </View>
            ) : (
              <>
                {reviews.map((rev) => (
                  <ReviewCard
                    key={rev.id}
                    review={rev}
                    currentUserId={session?.user?.id}
                    onEdit={() => {
                      setMyReview(rev);
                      setIsReviewModalVisible(true);
                    }}
                    onReport={() => handleReportReview(rev.id)}
                  />
                ))}

                {hasMoreReviews && (
                  <TouchableOpacity
                    style={styles.loadMoreButton}
                    onPress={handleLoadMoreReviews}
                    disabled={isLoadingMoreReviews}
                    activeOpacity={0.7}
                  >
                    {isLoadingMoreReviews ? (
                      <ActivityIndicator size="small" color={colors.accent.gold} />
                    ) : (
                      <Text style={styles.loadMoreText}>Carregar mais avaliações</Text>
                    )}
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Modal de Avaliação */}
      <ReviewModal
        visible={isReviewModalVisible}
        onClose={() => {
          setIsReviewModalVisible(false);
          setMyReview(null);
        }}
        onSubmit={handleReviewSubmit}
        onDelete={myReview ? handleDeleteReview : undefined}
        initialReview={myReview}
        targetName={restaurant.name}
      />
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: colors.background.primary,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
  },
  loadingText: {
    color: colors.accent.whiteSoft,
    marginTop: spacing.md,
    fontSize: typography.size.base,
  },
  errorTitle: {
    color: colors.accent.white,
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    marginTop: spacing.md,
    textAlign: "center",
  },
  errorMessage: {
    color: colors.accent.whiteSoft,
    fontSize: typography.size.sm,
    textAlign: "center",
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
    lineHeight: 20,
  },
  backButtonCenter: {
    backgroundColor: colors.accent.gold,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 8,
  },
  backButtonText: {
    color: colors.background.primary,
    fontWeight: typography.weight.bold,
  },
  scrollContent: {
    flexGrow: 1,
  },

  // ── NavBar ──────────────────────────────────────────────────────────────────
  navBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  navBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  navTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: typography.size.base,
    fontWeight: typography.weight.bold,
    color: colors.accent.white,
    marginHorizontal: spacing.sm,
  },
  navPlaceholder: {
    width: 40,
  },

  // ── Galeria de Fotos ────────────────────────────────────────────────────────
  galleryContainer: {
    width: "100%",
    height: 240,
    position: "relative",
    backgroundColor: colors.background.dark,
  },
  galleryImage: {
    height: 240,
  },
  galleryDots: {
    position: "absolute",
    bottom: 40,
    alignSelf: "center",
    flexDirection: "row",
    gap: 5,
  },
  galleryDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.4)",
  },
  galleryDotActive: {
    backgroundColor: colors.accent.gold,
    width: 16,
  },
  badgeRow: {
    position: "absolute",
    bottom: 12,
    left: 16,
    flexDirection: "row",
    gap: spacing.xs,
  },
  imagePlaceholder: {
    width: "100%",
    height: 200,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background.dark,
    position: "relative",
  },
  badgeRowPlaceholder: {
    position: "absolute",
    bottom: 12,
    left: 16,
    flexDirection: "row",
    gap: spacing.xs,
  },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.background.dark,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.accent.goldTintStrong,
  },
  ratingText: {
    color: colors.accent.gold,
    fontWeight: typography.weight.bold,
    fontSize: typography.size.xs,
  },
  newBadgeText: {
    color: colors.accent.gold,
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
  },
  priceBadge: {
    backgroundColor: colors.accent.gold,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  priceText: {
    color: colors.background.primary,
    fontWeight: typography.weight.bold,
    fontSize: typography.size.xs,
  },
  photoCountBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 14,
  },
  photoCountText: {
    color: colors.accent.white,
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
  },

  // ── Seção de Informações ────────────────────────────────────────────────────
  infoSection: {
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
    gap: spacing.xs,
  },
  restaurantName: {
    fontSize: typography.size.xxl,
    fontWeight: typography.weight.bold,
    color: colors.accent.white,
    marginBottom: spacing.xs,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginTop: 4,
  },
  cuisineText: {
    color: colors.accent.gold,
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
  },
  addressText: {
    flex: 1,
    color: colors.accent.whiteSoft,
    fontSize: typography.size.sm,
    lineHeight: 18,
  },
  phoneText: {
    color: colors.accent.goldMuted,
    fontSize: typography.size.sm,
    textDecorationLine: "underline",
  },
  infoSubText: {
    flex: 1,
    color: colors.accent.whiteSoft,
    fontSize: typography.size.sm,
    lineHeight: 18,
  },
  infoLabel: {
    color: colors.accent.goldMuted,
    fontWeight: typography.weight.medium,
  },
  descriptionText: {
    color: colors.accent.whiteLight,
    fontSize: typography.size.sm,
    lineHeight: 20,
    marginTop: spacing.sm,
  },

  // ── Ações Rápidas ──────────────────────────────────────────────────────────
  actionsRow: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: spacing.sm + 2,
    borderRadius: 12,
  },
  actionButtonPrimary: {
    backgroundColor: colors.accent.gold,
  },
  actionButtonPrimaryText: {
    color: colors.background.primary,
    fontWeight: typography.weight.bold,
    fontSize: typography.size.sm,
  },
  actionButtonSecondary: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: colors.accent.goldTintStrong,
  },
  actionButtonSecondaryText: {
    color: colors.accent.gold,
    fontWeight: typography.weight.semibold,
    fontSize: typography.size.sm,
  },

  // ── Seções genéricas ────────────────────────────────────────────────────────
  section: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  sectionTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.accent.white,
    marginBottom: spacing.md,
  },

  // ── Redes Sociais ──────────────────────────────────────────────────────────
  socialRow: {
    flexDirection: "row",
    gap: spacing.sm,
    flexWrap: "wrap",
  },
  socialButton: {
    flexDirection: "column",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: colors.accent.goldTintStrong,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minWidth: 80,
  },
  socialLabel: {
    color: colors.accent.whiteSoft,
    fontSize: typography.size.xs,
    fontWeight: typography.weight.medium,
  },

  // ── Horários ───────────────────────────────────────────────────────────────
  hoursRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
  },
  hoursRowToday: {
    backgroundColor: "rgba(212,175,55,0.08)",
    borderRadius: 8,
    paddingHorizontal: spacing.sm,
  },
  hoursDay: {
    color: colors.accent.whiteSoft,
    fontSize: typography.size.sm,
  },
  hoursDayToday: {
    color: colors.accent.gold,
    fontWeight: typography.weight.semibold,
  },
  hoursTime: {
    color: colors.accent.whiteLight,
    fontSize: typography.size.sm,
  },
  hoursTimeToday: {
    color: colors.accent.gold,
    fontWeight: typography.weight.medium,
  },

  // ── Formas de Pagamento ────────────────────────────────────────────────────
  paymentGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  paymentChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: colors.accent.goldTintStrong,
    borderRadius: 20,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  paymentChipText: {
    color: colors.accent.whiteSoft,
    fontSize: typography.size.xs,
    fontWeight: typography.weight.medium,
  },

  // ── Seção de Rota (HU9) ────────────────────────────────────────────────────
  routeCard: {
    margin: spacing.lg,
    backgroundColor: colors.background.dark,
    borderRadius: 18,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.accent.goldTintStrong,
  },
  routeHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  routeHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  routeSectionTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.accent.white,
  },
  profileToggle: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 20,
    padding: 3,
  },
  profileButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
  },
  profileButtonActive: {
    backgroundColor: colors.accent.gold,
  },
  profileButtonText: {
    fontSize: typography.size.xs,
    color: colors.accent.whiteSoft,
    fontWeight: typography.weight.medium,
  },
  profileButtonTextActive: {
    color: colors.background.primary,
    fontWeight: typography.weight.bold,
  },
  locationNotice: {
    padding: spacing.md,
    alignItems: "center",
    gap: spacing.sm,
  },
  locationNoticeText: {
    color: colors.accent.whiteSoft,
    textAlign: "center",
    fontSize: typography.size.sm,
    lineHeight: 18,
  },
  enableGpsButton: {
    backgroundColor: colors.accent.gold,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    marginTop: spacing.xs,
  },
  enableGpsButtonText: {
    color: colors.background.primary,
    fontWeight: typography.weight.bold,
    fontSize: typography.size.sm,
  },
  calculatingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: spacing.lg,
  },
  calculatingText: {
    color: colors.accent.whiteSoft,
    fontSize: typography.size.sm,
  },
  routeStatsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderRadius: 12,
    paddingVertical: spacing.md,
    marginBottom: spacing.sm,
  },
  statBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  statLabel: {
    fontSize: typography.size.xs,
    color: colors.accent.whiteLight,
  },
  statValue: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.bold,
    color: colors.accent.gold,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: "rgba(255, 255, 255, 0.12)",
  },
  fallbackWarning: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(212, 175, 55, 0.15)",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 8,
    marginBottom: spacing.sm,
  },
  fallbackWarningText: {
    flex: 1,
    color: colors.accent.gold,
    fontSize: typography.size.xs,
    lineHeight: 16,
  },
  mapContainer: {
    height: 180,
    borderRadius: 14,
    overflow: "hidden",
    marginTop: spacing.sm,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
  },
  miniMap: {
    ...StyleSheet.absoluteFillObject,
  },
  userPin: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "rgba(33, 150, 243, 0.3)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#2196F3",
  },
  userPinInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#2196F3",
  },
  restaurantPin: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.accent.gold,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.accent.white,
  },
  openMapButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.accent.gold,
    paddingVertical: spacing.sm,
    borderRadius: 12,
  },
  openMapButtonText: {
    color: colors.background.primary,
    fontWeight: typography.weight.bold,
    fontSize: typography.size.sm,
  },
  ratingOverviewRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: spacing.sm,
  },
  ratingBigScore: {
    alignItems: "center",
    justifyContent: "center",
    width: 105,
    paddingRight: spacing.sm,
  },
  ratingBigNumber: {
    fontSize: 34,
    fontWeight: typography.weight.bold,
    color: colors.accent.gold,
    lineHeight: 38,
  },
  ratingReviewsCount: {
    fontSize: typography.size.xs,
    color: colors.accent.whiteLight,
    marginTop: 4,
    textAlign: "center",
  },
  ratingDistributionWrapper: {
    flex: 1,
  },
  reviewActionsRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  evaluateRestaurantButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.accent.gold,
    borderRadius: 8,
    paddingVertical: spacing.sm,
    gap: 6,
  },
  evaluateRestaurantButtonText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
    color: colors.background.primary,
  },
  viewMenuReviewsButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: colors.accent.gold,
    borderRadius: 8,
    paddingVertical: spacing.sm,
    gap: 6,
  },
  viewMenuReviewsButtonText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
    color: colors.accent.gold,
  },
  reviewsListContainer: {
    marginTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border.card,
    paddingTop: spacing.md,
    gap: spacing.sm,
  },
  loadingReviewsBox: {
    paddingVertical: spacing.lg,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
  },
  loadingReviewsText: {
    fontSize: typography.size.xs,
    color: colors.accent.whiteSoft,
  },
  emptyReviewsCard: {
    paddingVertical: spacing.xl,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
  },
  emptyReviewsTitle: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
    color: colors.accent.white,
    marginTop: spacing.xs,
  },
  emptyReviewsSubtitle: {
    fontSize: typography.size.xs,
    color: colors.accent.whiteSoft,
    textAlign: "center",
    paddingHorizontal: spacing.md,
  },
  loadMoreButton: {
    paddingVertical: spacing.sm,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface.card,
    borderRadius: 8,
    marginTop: spacing.xs,
  },
  loadMoreText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
    color: colors.accent.gold,
  },
});

