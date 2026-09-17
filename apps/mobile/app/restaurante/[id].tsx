import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as Location from "expo-location";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { RestaurantResponse } from "@menu-digital/contracts";
import { fetchRestaurantById } from "../../services/api";
import {
  formatRouteDistance,
  formatRouteDuration,
} from "../../services/osrm";
import { useRouteCalculation } from "../../hooks/useRouteCalculation";
import { colors, spacing } from "../../theme";

// Importação condicional do react-native-maps para não quebrar a versão Web
let MapView: any = null;
let Marker: any = null;
let Polyline: any = null;
let UrlTile: any = null;

if (Platform.OS !== "web") {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Maps = require("react-native-maps");
  MapView = Maps.default;
  Marker = Maps.Marker;
  Polyline = Maps.Polyline;
  UrlTile = Maps.UrlTile;
}

const TILE_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";

export default function RestaurantDetailsScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [restaurant, setRestaurant] = useState<RestaurantResponse | null>(null);
  const [isLoadingRestaurant, setIsLoadingRestaurant] = useState(true);
  const [restaurantError, setRestaurantError] = useState<string | null>(null);

  const [userCoords, setUserCoords] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [locationStatus, setLocationStatus] = useState<
    "checking" | "granted" | "denied"
  >("checking");

  // Carrega os dados do restaurante
  useEffect(() => {
    let isMounted = true;
    if (!id) return;

    async function loadRestaurant() {
      setIsLoadingRestaurant(true);
      setRestaurantError(null);
      try {
        const data = await fetchRestaurantById(id as string);
        if (isMounted) setRestaurant(data);
      } catch (err: any) {
        if (isMounted) {
          setRestaurantError(
            err?.message || "Não foi possível carregar os detalhes do restaurante."
          );
        }
      } finally {
        if (isMounted) setIsLoadingRestaurant(false);
      }
    }

    loadRestaurant();
    return () => {
      isMounted = false;
    };
  }, [id]);

  // Obtém geolocalização do usuário para cálculo de rota (HU9)
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

  // Hook de cálculo de rota OSRM com fallback resiliente
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

  if (isLoadingRestaurant) {
    return (
      <View style={[styles.centerContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.accent.gold} />
        <Text style={styles.loadingText}>Carregando restaurante...</Text>
      </View>
    );
  }

  if (restaurantError || !restaurant) {
    return (
      <View style={[styles.centerContainer, { paddingTop: insets.top }]}>
        <MaterialCommunityIcons
          name="alert-circle-outline"
          size={56}
          color={colors.accent.redSoft}
        />
        <Text style={styles.errorTitle}>Ops! Algo deu errado</Text>
        <Text style={styles.errorMessage}>{restaurantError}</Text>
        <TouchableOpacity style={styles.backButtonCenter} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const displayAddress =
    restaurant.neighborhood && restaurant.city
      ? `${restaurant.street ? `${restaurant.street}, ` : ""}${
          restaurant.number ? `${restaurant.number} - ` : ""
        }${restaurant.neighborhood}, ${restaurant.city}`
      : restaurant.address || "Endereço não informado";

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
        {/* Header Superior com Botão Voltar */}
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
          <View style={styles.navPlaceholder} />
        </View>

        {/* Foto de Capa */}
        <View style={styles.imageContainer}>
          {restaurant.imageUrl ? (
            <Image
              source={{ uri: restaurant.imageUrl }}
              style={styles.image}
              contentFit="cover"
              transition={300}
            />
          ) : (
            <View style={styles.imagePlaceholder}>
              <MaterialCommunityIcons
                name="silverware-fork-knife"
                size={48}
                color={colors.accent.goldMuted}
              />
            </View>
          )}

          {/* Badges Flutuantes */}
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
          </View>
        </View>

        {/* Informações Principais */}
        <View style={styles.infoSection}>
          <Text style={styles.restaurantName}>{restaurant.name}</Text>

          {restaurant.cuisineType ? (
            <View style={styles.cuisineRow}>
              <MaterialCommunityIcons
                name="food-variant"
                size={16}
                color={colors.accent.gold}
              />
              <Text style={styles.cuisineText}>{restaurant.cuisineType}</Text>
            </View>
          ) : null}

          <View style={styles.addressRow}>
            <MaterialCommunityIcons
              name="map-marker-outline"
              size={18}
              color={colors.accent.goldMuted}
            />
            <Text style={styles.addressText}>{displayAddress}</Text>
          </View>

          {restaurant.description ? (
            <Text style={styles.descriptionText}>{restaurant.description}</Text>
          ) : null}
        </View>

        {/* ── Seção HU9: Como Chegar / Rota e Tempo Estimado ── */}
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

              {/* Banner de Fallback para Haversine (quando OSRM estiver fora do ar) */}
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

              {/* Mini Mapa com Traçado da Polyline */}
              {Platform.OS !== "web" && MapView && route ? (
                <View style={styles.mapContainer}>
                  <MapView
                    style={styles.miniMap}
                    initialRegion={{
                      latitude: (userCoords.latitude + restaurant.latitude) / 2,
                      longitude: (userCoords.longitude + restaurant.longitude) / 2,
                      latitudeDelta:
                        Math.max(
                          Math.abs(userCoords.latitude - restaurant.latitude) * 1.5,
                          0.02
                        ),
                      longitudeDelta:
                        Math.max(
                          Math.abs(userCoords.longitude - restaurant.longitude) * 1.5,
                          0.02
                        ),
                    }}
                    showsCompass={false}
                    showsScale={false}
                    rotateEnabled={false}
                    scrollEnabled={false}
                    zoomEnabled={false}
                  >
                    <UrlTile urlTemplate={TILE_URL} maximumZ={19} flipY={false} />

                    {/* Marcador do Usuário */}
                    <Marker coordinate={userCoords} title="Você está aqui">
                      <View style={styles.userPin}>
                        <View style={styles.userPinInner} />
                      </View>
                    </Marker>

                    {/* Marcador do Restaurante */}
                    <Marker
                      coordinate={{
                        latitude: restaurant.latitude,
                        longitude: restaurant.longitude,
                      }}
                      title={restaurant.name}
                    >
                      <View style={styles.restaurantPin}>
                        <MaterialCommunityIcons
                          name="silverware-fork-knife"
                          size={16}
                          color={colors.background.primary}
                        />
                      </View>
                    </Marker>

                    {/* Rota traçada visualmente (Polyline) */}
                    {route.polylineCoordinates.length > 0 ? (
                      <Polyline
                        coordinates={route.polylineCoordinates}
                        strokeColor={colors.accent.gold}
                        strokeWidth={4}
                        lineDashPattern={route.isFallback ? [8, 6] : undefined}
                      />
                    ) : null}
                  </MapView>
                </View>
              ) : null}

              {/* Botão para abrir o mapa interativo completo */}
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
      </ScrollView>
    </View>
  );
}

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
  },
  errorMessage: {
    color: colors.accent.whiteSoft,
    fontSize: typography.size.sm,
    textAlign: "center",
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
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
  imageContainer: {
    width: "100%",
    height: 220,
    position: "relative",
    backgroundColor: colors.background.dark,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  imagePlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background.dark,
  },
  badgeRow: {
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
  infoSection: {
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  restaurantName: {
    fontSize: typography.size.xxl,
    fontWeight: typography.weight.bold,
    color: colors.accent.white,
    marginBottom: spacing.xs,
  },
  cuisineRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: spacing.xs,
  },
  cuisineText: {
    color: colors.accent.gold,
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    marginBottom: spacing.sm,
  },
  addressText: {
    flex: 1,
    color: colors.accent.whiteSoft,
    fontSize: typography.size.sm,
    lineHeight: 18,
  },
  descriptionText: {
    color: colors.accent.whiteLight,
    fontSize: typography.size.sm,
    lineHeight: 20,
    marginTop: spacing.xs,
  },
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
});
