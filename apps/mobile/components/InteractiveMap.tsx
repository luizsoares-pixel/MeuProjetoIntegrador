import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Location from "expo-location";
import { colors } from "../theme";
import { useNearbyRestaurants } from "../hooks/useNearbyRestaurants";
import { useMockRestaurants } from "../hooks/useMockRestaurants";
import { useRouteCalculation } from "../hooks/useRouteCalculation";
import { formatRouteDistance, formatRouteDuration } from "../services/osrm";
import { LeafletMap, type LeafletMapRef } from "./LeafletMap";
import { Loading } from "./Loading";
import { RestaurantPreviewCard } from "./RestaurantPreviewCard";
import { RestaurantErrorState } from "./RestaurantErrorState";
import type { NearbyRestaurant } from "../services/api";

const DEFAULT_REGION = {
  latitude: -15.835,
  longitude: -48.048,
  latitudeDelta: 0.08,
  longitudeDelta: 0.08,
};

/**
 * Distância mínima (em metros) que o usuário precisa se deslocar entre
 * focagens na tela para que uma nova requisição ao endpoint de restaurantes
 * seja disparada. Evita chamadas redundantes causadas por ruído de precisão
 * do GPS (que pode variar alguns metros a cada leitura sem o usuário se mover).
 */
const MIN_LOCATION_UPDATE_METERS = 100;

/**
 * Fórmula de Haversine simplificada para uso no cliente.
 * Retorna distância em metros entre dois pontos geográficos.
 * Mesma implementação do backend (restaurant.service.ts) — mantém consistência.
 */
function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6_371_000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

type LocationState = "loading" | "granted" | "denied" | "gps-off" | "unavailable";

export default function InteractiveMap() {
  const mapRef = useRef<LeafletMapRef>(null);
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [locationReady, setLocationReady] = useState(false);
  const [locationState, setLocationState] = useState<LocationState>("loading");
  const [mapReady, setMapReady] = useState(false);
  const [tilesReady, setTilesReady] = useState(false);
  const [mapError, setMapError] = useState(false);

  const locationEnabled = locationState === "granted" && !!userLocation;
  const isLoading = !locationReady || (!tilesReady && !mapError) || (!mapReady && !mapError);
  const showLocationFallback =
    locationReady &&
    (locationState === "denied" ||
      locationState === "gps-off" ||
      locationState === "unavailable");

  // ── Issue #34: Restaurantes próximos ────────────────────────────────────────
  const [selectedRestaurant, setSelectedRestaurant] =
    useState<NearbyRestaurant | null>(null);

  // ── Issue #54 (HU9): Cálculo de rota ativa no mapa ─────────────────────────
  const [activeRouteRestaurant, setActiveRouteRestaurant] =
    useState<NearbyRestaurant | null>(null);

  const {
    route: activeRoute,
    isLoading: isCalculatingActiveRoute,
    profile: routeProfile,
    setProfile: setRouteProfile,
  } = useRouteCalculation({
    restaurantId: activeRouteRestaurant?.id,
    restaurantCoords: activeRouteRestaurant
      ? {
          latitude: activeRouteRestaurant.latitude,
          longitude: activeRouteRestaurant.longitude,
        }
      : null,
    userCoords: userLocation,
    enabled: Boolean(activeRouteRestaurant && userLocation),
  });

  // ── Issue #34 & #35: Controle de dados reais vs. mocks para validação ───────
  const useMocks =
    __DEV__ && process.env.EXPO_PUBLIC_USE_MOCK_RESTAURANTS === "true";

  const targetLat = userLocation?.latitude ?? DEFAULT_REGION.latitude;
  const targetLng = userLocation?.longitude ?? DEFAULT_REGION.longitude;

  const {
    restaurants,
    isLoading: isLoadingRestaurants,
    isError: isRestaurantError,
    isEmpty: isRestaurantEmpty,
    refetch: refetchRestaurants,
  } = useNearbyRestaurants({
    lat: targetLat,
    lng: targetLng,
    radius: 10000,
    enabled: !useMocks,
  });

  const mockRestaurants = useMockRestaurants(
    userLocation?.latitude ?? DEFAULT_REGION.latitude,
    userLocation?.longitude ?? DEFAULT_REGION.longitude,
    80
  );
  const allRestaurants = useMocks ? mockRestaurants : restaurants;

  const openLocationSettings = useCallback(async () => {
    const canOpen = await Linking.canOpenURL("app-settings:");
    if (canOpen) {
      await Linking.openURL("app-settings:");
      return;
    }

    await Linking.openSettings();
  }, []);

  const centerOnUser = useCallback(() => {
    if (!userLocation) return;
    mapRef.current?.centerOn(userLocation.latitude, userLocation.longitude, 15);
  }, [userLocation]);

  const loadLocation = useCallback(async () => {
    try {
      const permission = await Location.requestForegroundPermissionsAsync();

      if (permission.status !== "granted") {
        setLocationState("denied");
        setLocationReady(true);
        return;
      }

      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) {
        setLocationState("gps-off");
        setLocationReady(true);
        return;
      }

      // 1. Tenta recuperar a última posição conhecida instantaneamente
      const cached = await Location.getLastKnownPositionAsync({});
      if (cached) {
        const cachedCoord = {
          latitude: cached.coords.latitude,
          longitude: cached.coords.longitude,
        };
        setUserLocation(cachedCoord);
        setLocationState("granted");
        setLocationReady(true);
      }

      // 2. Busca posição atual com precisão balanceada e timeout de 4 segundos
      const currentPositionPromise = Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const timeoutPromise = new Promise<null>((resolve) =>
        setTimeout(() => resolve(null), 4000)
      );

      const currentLocation =
        (await Promise.race([currentPositionPromise, timeoutPromise])) || cached;

      if (!currentLocation) {
        setLocationState("granted");
        setLocationReady(true);
        return;
      }

      const nextUserLocation = {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      };

      setUserLocation((prevLocation) => {
        if (prevLocation !== null) {
          const moved = haversineDistance(
            prevLocation.latitude,
            prevLocation.longitude,
            nextUserLocation.latitude,
            nextUserLocation.longitude
          );
          if (moved < MIN_LOCATION_UPDATE_METERS) {
            return prevLocation;
          }
        }
        return nextUserLocation;
      });

      setLocationState("granted");
      setLocationReady(true);
    } catch (error) {
      console.warn("Não foi possível obter a localização:", error);
      setLocationState("unavailable");
      setLocationReady(true);
    }
  }, []);

  useEffect(() => {
    loadLocation();
    refetchRestaurants();
  }, [loadLocation, refetchRestaurants]);

  useEffect(() => {
    if (mapReady) return;
    const timeout = setTimeout(() => {
      setMapReady(true);
      setTilesReady(true);
    }, 3500);
    return () => clearTimeout(timeout);
  }, [mapReady]);

  useEffect(() => {
    if (mapReady && locationEnabled && userLocation) {
      mapRef.current?.centerOn(userLocation.latitude, userLocation.longitude, 14);
    }
  }, [mapReady, locationEnabled, userLocation]);

  return (
    <View style={styles.container}>
      <LeafletMap
        ref={mapRef}
        style={styles.map}
        initialCenter={{
          latitude: DEFAULT_REGION.latitude,
          longitude: DEFAULT_REGION.longitude,
        }}
        initialZoom={13}
        userLocation={userLocation}
        restaurants={allRestaurants}
        routeCoordinates={activeRoute?.polylineCoordinates}
        interactive={true}
        onMarkerSelect={(id) => {
          const rest = allRestaurants.find((r) => r.id === id);
          if (rest) {
            setSelectedRestaurant(rest);
          }
        }}
        onMapTap={() => {
          if (!activeRouteRestaurant) {
            setSelectedRestaurant(null);
          }
        }}
        onReady={() => {
          setMapReady(true);
          setTilesReady(true);
        }}
        onError={() => {
          setMapError(true);
        }}
      />

      <View style={styles.topBar}>
        <View style={styles.titleRow}>
          <View style={styles.titleIcon}>
            <MaterialCommunityIcons
              name="map-marker-radius"
              size={22}
              color={colors.accent.gold}
            />
          </View>
          <View>
            <Text style={styles.eyebrow}>EXPLORAR</Text>
            <Text style={styles.title}>Restaurantes próximos</Text>
          </View>
        </View>
        <View style={styles.statusPill}>
          <View
            style={[styles.statusDot, locationEnabled && styles.statusDotActive]}
          />
          <Text style={styles.statusLabel}>
            {locationEnabled ? "Sua região" : "Região padrão"}
          </Text>
        </View>
      </View>

      <View style={styles.mapControls}>
        <Pressable
          accessibilityLabel="Cadastrar novo restaurante"
          accessibilityRole="button"
          onPress={() => router.push("/cadastrar-restaurante")}
          style={({ pressed }) => [
            styles.controlButton,
            pressed && styles.controlButtonPressed,
          ]}
        >
          <MaterialCommunityIcons
            name="store-plus"
            size={24}
            color={colors.background.primary}
          />
        </Pressable>

        <Pressable
          accessibilityLabel="Centralizar mapa na minha localização"
          accessibilityRole="button"
          disabled={!locationEnabled}
          onPress={centerOnUser}
          style={({ pressed }) => [
            styles.controlButton,
            !locationEnabled && styles.controlButtonDisabled,
            pressed && styles.controlButtonPressed,
          ]}
        >
          <MaterialCommunityIcons
            name="crosshairs-gps"
            size={24}
            color={
              locationEnabled
                ? colors.background.primary
                : colors.accent.whiteLight
            }
          />
        </Pressable>
      </View>

      <View style={styles.attribution}>
        <Text style={styles.attributionText}>© OpenStreetMap & CARTO</Text>
      </View>

      {isLoading ? (
        <View style={styles.loadingOverlay}>
          <Loading size="large" color={colors.accent.gold} />
          <Text style={styles.statusText}>
            {!locationReady
              ? "Obtendo sua localização..."
              : "Carregando mapa..."}
          </Text>
        </View>
      ) : null}

      {mapError ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>
            Não foi possível carregar o mapa. Verifique sua conexão e tente novamente.
          </Text>
        </View>
      ) : null}

      {showLocationFallback ? (
        <View style={styles.infoBanner}>
          <MaterialCommunityIcons
            name="map-marker-off-outline"
            size={20}
            color={colors.accent.gold}
          />
          <View style={styles.infoContent}>
            <Text style={styles.infoText}>
              {locationState === "gps-off"
                ? "O GPS do dispositivo está desligado. Ligue o GPS para localizar restaurantes próximos."
                : locationState === "unavailable"
                  ? "Não foi possível acessar sua localização agora. Tente novamente em instantes."
                  : "Precisamos da sua localização para centralizar o mapa e mostrar restaurantes perto de você."}
            </Text>
            {locationState === "denied" ? (
              <Pressable
                accessibilityRole="button"
                onPress={openLocationSettings}
                style={styles.settingsButton}
              >
                <Text style={styles.settingsButtonText}>Abrir configurações</Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      ) : null}

      {/* Issue #37: Banners padronizados de estado dos restaurantes */}
      {!isLoading || isRestaurantError ? (
        <>
          {isLoadingRestaurants ? (
            <View style={styles.restaurantLoadingBanner}>
              <Loading size="small" color={colors.accent.gold} />
              <Text style={styles.restaurantLoadingText}>
                Buscando restaurantes próximos...
              </Text>
            </View>
          ) : null}

          {isRestaurantError && !isLoadingRestaurants ? (
            <View style={styles.restaurantErrorOverlay}>
              <RestaurantErrorState onRetry={refetchRestaurants} />
            </View>
          ) : null}

          {isRestaurantEmpty && !isLoadingRestaurants ? (
            <View style={styles.restaurantEmptyBanner}>
              <MaterialCommunityIcons
                name="store-search-outline"
                size={18}
                color={colors.accent.goldMuted}
              />
              <Text style={styles.restaurantEmptyText}>
                Nenhum restaurante encontrado no raio de busca.
              </Text>
            </View>
          ) : null}
        </>
      ) : null}

      {/* Preview ao tocar no pin */}
      <RestaurantPreviewCard
        restaurant={selectedRestaurant}
        visible={selectedRestaurant !== null && activeRouteRestaurant === null}
        onClose={() => setSelectedRestaurant(null)}
        onTraceRoute={(restaurant) => {
          setActiveRouteRestaurant(restaurant);
          setSelectedRestaurant(null);
        }}
      />

      {/* Issue #54 (HU9): Card flutuante de rota ativa */}
      {activeRouteRestaurant ? (
        <View style={styles.activeRouteCard}>
          <View style={styles.activeRouteHeader}>
            <View style={styles.activeRouteTitleContainer}>
              <Text style={styles.activeRouteEyebrow}>ROTA ATIVA</Text>
              <Text style={styles.activeRouteName} numberOfLines={1}>
                {activeRouteRestaurant.name}
              </Text>
            </View>
            <Pressable
              onPress={() => setActiveRouteRestaurant(null)}
              style={styles.activeRouteCloseBtn}
              accessibilityRole="button"
              accessibilityLabel="Fechar rota"
            >
              <MaterialCommunityIcons
                name="close"
                size={18}
                color={colors.accent.white}
              />
            </Pressable>
          </View>

          {/* Seletor de Modo (Carro vs A pé) */}
          <View style={styles.routeProfileRow}>
            <Pressable
              style={[
                styles.profileToggleBtn,
                routeProfile === "driving" && styles.profileToggleBtnActive,
              ]}
              onPress={() => setRouteProfile("driving")}
              accessibilityRole="button"
              accessibilityLabel="Rota de carro"
            >
              <MaterialCommunityIcons
                name="car"
                size={16}
                color={
                  routeProfile === "driving"
                    ? colors.background.primary
                    : colors.accent.goldMuted
                }
              />
              <Text
                style={[
                  styles.profileToggleText,
                  routeProfile === "driving" && styles.profileToggleTextActive,
                ]}
              >
                Carro
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.profileToggleBtn,
                routeProfile === "walking" && styles.profileToggleBtnActive,
              ]}
              onPress={() => setRouteProfile("walking")}
              accessibilityRole="button"
              accessibilityLabel="Rota a pé"
            >
              <MaterialCommunityIcons
                name="walk"
                size={16}
                color={
                  routeProfile === "walking"
                    ? colors.background.primary
                    : colors.accent.goldMuted
                }
              />
              <Text
                style={[
                  styles.profileToggleText,
                  routeProfile === "walking" && styles.profileToggleTextActive,
                ]}
              >
                A pé
              </Text>
            </Pressable>
          </View>

          {/* Informações da Rota (Tempo / Distância / Loading / Fallback) */}
          {isCalculatingActiveRoute ? (
            <View style={styles.activeRouteLoading}>
              <ActivityIndicator size="small" color={colors.accent.gold} />
              <Text style={styles.activeRouteLoadingText}>
                Calculando trajeto via OSRM...
              </Text>
            </View>
          ) : activeRoute ? (
            <View style={styles.activeRouteStatsRow}>
              <View style={styles.activeRouteStat}>
                <MaterialCommunityIcons
                  name="clock-outline"
                  size={16}
                  color={colors.accent.gold}
                />
                <Text style={styles.activeRouteStatValue}>
                  {formatRouteDuration(activeRoute.durationInSeconds)}
                </Text>
              </View>

              <View style={styles.activeRouteStat}>
                <MaterialCommunityIcons
                  name="map-marker-distance"
                  size={16}
                  color={colors.accent.gold}
                />
                <Text style={styles.activeRouteStatValue}>
                  {formatRouteDistance(activeRoute.distanceInMeters)}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.activeRouteDetailsBtn}
                onPress={() =>
                  router.push(`/restaurante/${activeRouteRestaurant.id}`)
                }
                accessibilityRole="button"
                accessibilityLabel="Ver página do restaurante"
              >
                <Text style={styles.activeRouteDetailsBtnText}>Detalhes</Text>
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={16}
                  color={colors.background.primary}
                />
              </TouchableOpacity>
            </View>
          ) : null}

          {activeRoute?.isFallback ? (
            <Text style={styles.activeRouteFallbackText}>
              * Estimativa em linha reta (serviço OSRM indisponível no momento).
            </Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.soft,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  topBar: {
    position: "absolute",
    top: 16,
    left: 16,
    right: 16,
    padding: 14,
    borderRadius: 16,
    backgroundColor: "rgba(47, 0, 0, 0.92)",
    borderWidth: 1,
    borderColor: colors.accent.goldTintStrong,
    boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.22)",
    elevation: 6,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  titleIcon: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: colors.accent.goldTint,
  },
  eyebrow: {
    color: colors.accent.goldMuted,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.5,
  },
  title: {
    marginTop: 2,
    color: colors.accent.white,
    fontSize: 18,
    fontWeight: "700",
  },
  statusPill: {
    position: "absolute",
    right: 14,
    bottom: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.accent.goldMuted,
  },
  statusDotActive: {
    backgroundColor: colors.accent.success,
  },
  statusLabel: {
    color: colors.accent.whiteLight,
    fontSize: 11,
  },
  mapControls: {
    position: "absolute",
    right: 16,
    bottom: 76,
    gap: 12,
  },
  controlButton: {
    width: 50,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    backgroundColor: colors.accent.gold,
    boxShadow: "0px 3px 6px rgba(0, 0, 0, 0.25)",
    elevation: 5,
  },
  controlButtonDisabled: {
    backgroundColor: colors.background.dark,
    borderWidth: 1,
    borderColor: colors.accent.whiteLight,
  },
  controlButtonPressed: {
    transform: [{ scale: 0.94 }],
  },
  attribution: {
    position: "absolute",
    left: 8,
    bottom: 5,
    paddingHorizontal: 5,
    paddingVertical: 2,
    backgroundColor: "rgba(255, 255, 255, 0.78)",
    borderRadius: 4,
  },
  attributionText: {
    color: colors.accent.textDark,
    fontSize: 9,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(47, 0, 0, 0.72)",
    gap: 12,
  },
  statusText: {
    color: colors.accent.white,
    fontSize: 15,
    fontWeight: "600",
  },
  errorBanner: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 16,
    padding: 14,
    borderRadius: 8,
    backgroundColor: colors.accent.red,
  },
  errorText: {
    color: colors.accent.white,
    textAlign: "center",
    fontSize: 14,
  },
  infoBanner: {
    position: "absolute",
    left: 16,
    right: 16,
    top: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 13,
    borderRadius: 14,
    backgroundColor: colors.background.dark,
    borderWidth: 1,
    borderColor: colors.accent.goldTintStrong,
  },
  infoContent: {
    flex: 1,
    gap: 10,
  },
  infoText: {
    color: colors.accent.white,
    textAlign: "left",
    fontSize: 13,
    flex: 1,
  },
  settingsButton: {
    alignSelf: "flex-start",
    backgroundColor: colors.accent.gold,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  settingsButtonText: {
    color: colors.background.primary,
    fontSize: 12,
    fontWeight: "700",
  },

  // ── Issue #34: Estilos de estado dos restaurantes ──────────────────────────
  restaurantLoadingBanner: {
    position: "absolute",
    bottom: 88,
    left: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "rgba(47, 0, 0, 0.88)",
    borderWidth: 1,
    borderColor: colors.accent.goldTintStrong,
  },
  restaurantLoadingText: {
    color: colors.accent.white,
    fontSize: 13,
    fontWeight: "600",
    flex: 1,
  },
  restaurantErrorOverlay: {
    position: "absolute",
    bottom: 88,
    left: 16,
    right: 16,
    maxHeight: 330,
    borderRadius: 12,
    backgroundColor: "rgba(47, 0, 0, 0.92)",
  },
  restaurantEmptyBanner: {
    position: "absolute",
    bottom: 88,
    left: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "rgba(47, 0, 0, 0.88)",
    borderWidth: 1,
    borderColor: colors.accent.goldTintStrong,
  },
  restaurantEmptyText: {
    color: colors.accent.goldMuted,
    fontSize: 13,
    flex: 1,
  },

  // ── Issue #54 (HU9): Estilos do Card de Rota Ativa no Mapa ───────────────
  activeRouteCard: {
    position: "absolute",
    bottom: 24,
    left: 16,
    right: 16,
    padding: 14,
    borderRadius: 16,
    backgroundColor: "rgba(47, 0, 0, 0.95)",
    borderWidth: 1.5,
    borderColor: colors.accent.gold,
    elevation: 8,
    boxShadow: "0px 6px 16px rgba(0, 0, 0, 0.35)",
    gap: 10,
  },
  activeRouteHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  activeRouteTitleContainer: {
    flex: 1,
    marginRight: 8,
  },
  activeRouteEyebrow: {
    color: colors.accent.goldMuted,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.2,
  },
  activeRouteName: {
    color: colors.accent.white,
    fontSize: 16,
    fontWeight: "700",
    marginTop: 2,
  },
  activeRouteCloseBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  routeProfileRow: {
    flexDirection: "row",
    gap: 8,
  },
  profileToggleBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(230, 192, 123, 0.3)",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  profileToggleBtnActive: {
    backgroundColor: colors.accent.gold,
    borderColor: colors.accent.gold,
  },
  profileToggleText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.accent.goldMuted,
  },
  profileToggleTextActive: {
    color: colors.background.primary,
    fontWeight: "700",
  },
  activeRouteLoading: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 4,
  },
  activeRouteLoadingText: {
    color: colors.accent.goldMuted,
    fontSize: 12,
  },
  activeRouteStatsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: "rgba(230, 192, 123, 0.2)",
  },
  activeRouteStat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  activeRouteStatValue: {
    color: colors.accent.white,
    fontSize: 14,
    fontWeight: "700",
  },
  activeRouteDetailsBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: colors.accent.gold,
  },
  activeRouteDetailsBtnText: {
    color: colors.background.primary,
    fontSize: 12,
    fontWeight: "700",
  },
  activeRouteFallbackText: {
    color: colors.accent.goldMuted,
    fontSize: 10,
    fontStyle: "italic",
    marginTop: -2,
  },
});
