import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import * as Location from "expo-location";
import MapView, { Marker, UrlTile } from "react-native-maps";
import { colors } from "../theme";
import { useNearbyRestaurants } from "../hooks/useNearbyRestaurants";
import { useMapClusters } from "../hooks/useMapClusters";
import { useMockRestaurants } from "../hooks/useMockRestaurants";
import { ClusterMarker } from "./ClusterMarker";
import { RestaurantPinMarker } from "./RestaurantPinMarker";
import { RestaurantPreviewCard } from "./RestaurantPreviewCard";
import type { NearbyRestaurant } from "../services/api";

const DEFAULT_REGION = {
  latitude: -23.55052,
  longitude: -46.633308,
  latitudeDelta: 0.08,
  longitudeDelta: 0.08,
};

const TILE_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const TILE_USER_AGENT = "MenuDigital/1.0 (mapa; contato: suporte@menudigital.app)";

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
  lat1: number, lng1: number,
  lat2: number, lng2: number,
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
  const mapRef = useRef<MapView>(null);
  const [region, setRegion] = useState(DEFAULT_REGION);
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
    locationReady && (locationState === "denied" || locationState === "gps-off" || locationState === "unavailable");

  // ── Issue #34: Restaurantes próximos ────────────────────────────────────────
  const [selectedRestaurant, setSelectedRestaurant] = useState<NearbyRestaurant | null>(null);

  const shouldFetchRestaurants = !__DEV__ && locationState === "granted";

  const {
    restaurants,
    isLoading: isLoadingRestaurants,
    isError: isRestaurantError,
    isEmpty: isRestaurantEmpty,
    errorMessage: restaurantErrorMessage,
    refetch: refetchRestaurants,
  } = useNearbyRestaurants({
    lat: userLocation?.latitude ?? null,
    lng: userLocation?.longitude ?? null,
    radius: 5000,
    enabled: shouldFetchRestaurants,
  });
  // ────────────────────────────────────────────────────────────────────────────

  // ── Issue #35: Clustering de pins ───────────────────────────────────────────
  // Em desenvolvimento, usamos dados simulados para validar clustering e gesto
  // do mapa sem depender do backend ou do banco real.
  const mockRestaurants = useMockRestaurants(
    userLocation?.latitude ?? null,
    userLocation?.longitude ?? null,
    80
  );
  const allRestaurants = __DEV__ ? mockRestaurants : restaurants;

  const { clusters, expandCluster } = useMapClusters(allRestaurants, region);

  /**
   * Ao tocar num cluster, anima o mapa para o zoom de expansão calculado
   * pelo supercluster — revela os pins individuais daquela região.
   * Converte nível de zoom tile → latitudeDelta (inverso de regionToZoom).
   */
  function handleClusterPress(
    clusterId: number,
    clusterCoordinate: { latitude: number; longitude: number }
  ) {
    const expansionZoom = expandCluster(clusterId);
    const delta = 360 / Math.pow(2, expansionZoom);
    mapRef.current?.animateToRegion(
      {
        latitude:        clusterCoordinate.latitude,
        longitude:       clusterCoordinate.longitude,
        latitudeDelta:   delta,
        longitudeDelta:  delta,
      },
      400
    );
  }
  // ────────────────────────────────────────────────────────────────────────────

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

    const nextRegion = {
      ...DEFAULT_REGION,
      latitude: userLocation.latitude,
      longitude: userLocation.longitude,
    };

    mapRef.current?.animateToRegion(nextRegion, 500);
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

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const nextUserLocation = {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      };

      // Evita chamadas redundantes à API quando o GPS retorna coordenadas
      // praticamente idênticas entre focagens (ruído de precisão < 100 m).
      // Na primeira carga (userLocationRef.current === null) sempre prossegue.
      setUserLocation((prevLocation) => {
        if (prevLocation !== null) {
          const moved = haversineDistance(
            prevLocation.latitude,
            prevLocation.longitude,
            nextUserLocation.latitude,
            nextUserLocation.longitude,
          );
          if (moved < MIN_LOCATION_UPDATE_METERS) {
            // Sem deslocamento significativo: mantém a localização anterior
            // e não dispara nova requisição de restaurantes.
            return prevLocation;
          }
        }
        return nextUserLocation;
      });

      setRegion((currentRegion) => ({
        ...currentRegion,
        ...nextUserLocation,
      }));
      setLocationState("granted");
      setLocationReady(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : "unknown";
      setLocationState("unavailable");
      setLocationReady(true);
      Alert.alert(
        "Localização indisponível",
        `Não foi possível acessar sua localização no momento. ${message}`,
      );
    }
  }, []);


  useFocusEffect(
    useCallback(() => {
      loadLocation();
    }, [loadLocation]),
  );

  useEffect(() => {
    let mounted = true;

    fetch(TILE_URL.replace("{z}/{x}/{y}", "0/0/0"), {
      headers: { "User-Agent": TILE_USER_AGENT },
    })
      .then((response) => {
        if (!response.ok) throw new Error("Tile server unavailable");
        if (mounted) setTilesReady(true);
      })
      .catch(() => {
        if (mounted) setMapError(true);
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (mapReady) return;

    const timeout = setTimeout(() => setMapError(true), 15000);
    return () => clearTimeout(timeout);
  }, [mapReady]);

  useEffect(() => {
    if (mapReady && locationEnabled && userLocation) {
      mapRef.current?.animateToRegion(
        {
          ...DEFAULT_REGION,
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
        },
        700,
      );
    }
  }, [mapReady, locationEnabled, userLocation]);

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={region}
        showsUserLocation={locationEnabled}
        showsMyLocationButton={false}
        showsCompass={false}
        showsScale={false}
        rotateEnabled={false}
        onMapReady={() => setMapReady(true)}
        // Mantém region sincronizado ao pan/zoom do usuário.
        // Os pins de restaurantes são baseados na posição GPS (não no centro do mapa) —
        // comportamento intencional para HU2. feat/35 usará esta region para clustering.
        onRegionChangeComplete={(newRegion) => setRegion(newRegion)}
        accessibilityLabel="Mapa de restaurantes próximos"
      >
        <UrlTile
          urlTemplate={TILE_URL}
          maximumZ={19}
          flipY={false}
        />

        {userLocation ? (
          <Marker coordinate={userLocation} tracksViewChanges={false}>
            <View style={styles.userMarkerContainer}>
              <View style={styles.userMarkerOuterRing}>
                <View style={styles.userMarkerInnerDot} />
              </View>
            </View>
          </Marker>
        ) : null}

        {/* Issue #35: Clusterização de pins próximos */}
        {clusters.map((cluster) => {
          const [longitude, latitude] = cluster.geometry.coordinates as [number, number];
          const coordinate = { latitude, longitude };

          if ("cluster" in cluster.properties && cluster.properties.cluster) {
            return (
              <ClusterMarker
                key={`cluster-${cluster.id}`}
                id={cluster.id as number}
                coordinate={coordinate}
                count={cluster.properties.point_count}
                onPress={() => handleClusterPress(cluster.id as number, coordinate)}
              />
            );
          }

          const restaurant = cluster.properties.restaurant as NearbyRestaurant;
          return (
            <RestaurantPinMarker
              key={restaurant.id}
              restaurant={restaurant}
              onPress={setSelectedRestaurant}
            />
          );
        })}
      </MapView>

      <View style={styles.topBar}>
        <View style={styles.titleRow}>
          <View style={styles.titleIcon}>
            <MaterialCommunityIcons name="map-marker-radius" size={22} color={colors.accent.gold} />
          </View>
          <View>
            <Text style={styles.eyebrow}>EXPLORAR</Text>
            <Text style={styles.title}>Restaurantes próximos</Text>
          </View>
        </View>
        <View style={styles.statusPill}>
          <View style={[styles.statusDot, locationEnabled && styles.statusDotActive]} />
          <Text style={styles.statusLabel}>{locationEnabled ? "Sua região" : "Região padrão"}</Text>
        </View>
      </View>

      <View style={styles.mapControls}>
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
            color={locationEnabled ? colors.background.primary : colors.accent.whiteLight}
          />
        </Pressable>
      </View>

      <View style={styles.attribution}>
        <Text style={styles.attributionText}>© OpenStreetMap contributors</Text>
      </View>

      {isLoading ? (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator color={colors.accent.gold} size="large" />
          <Text style={styles.statusText}>Carregando mapa...</Text>
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

      {/* Issue #34: Banners de estado dos restaurantes (visíveis só após o mapa carregar) */}
      {mapReady && !isLoading ? (
        <>
          {isLoadingRestaurants ? (
            <View style={styles.restaurantLoadingBanner}>
              <ActivityIndicator color={colors.accent.gold} size="small" />
              <Text style={styles.restaurantLoadingText}>
                Buscando restaurantes próximos...
              </Text>
            </View>
          ) : null}

          {isRestaurantError && !isLoadingRestaurants ? (
            <View style={styles.restaurantErrorBanner}>
              <MaterialCommunityIcons
                name="wifi-off"
                size={18}
                color={colors.accent.white}
              />
              <Text style={styles.restaurantErrorText} numberOfLines={2}>
                {restaurantErrorMessage ?? "Não foi possível carregar os restaurantes."}
              </Text>
              <Pressable
                onPress={refetchRestaurants}
                style={styles.retryButton}
                accessibilityRole="button"
                accessibilityLabel="Tentar novamente"
              >
                <Text style={styles.retryButtonText}>Tentar novamente</Text>
              </Pressable>
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
                Nenhum restaurante encontrado nesta área.
              </Text>
            </View>
          ) : null}
        </>
      ) : null}

      {/* Preview ao tocar no pin */}
      <RestaurantPreviewCard
        restaurant={selectedRestaurant}
        visible={selectedRestaurant !== null}
        onClose={() => setSelectedRestaurant(null)}
      />
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
  userMarkerContainer: {
    width: 22,
    height: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  userMarkerOuterRing: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(33, 150, 243, 0.18)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(33, 150, 243, 0.75)",
  },
  userMarkerInnerDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.accent.gold,
    borderWidth: 2,
    borderColor: colors.accent.white,
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
  restaurantErrorBanner: {
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
    backgroundColor: colors.accent.red,
  },
  restaurantErrorText: {
    color: colors.accent.white,
    fontSize: 12,
    flex: 1,
  },
  retryButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: colors.accent.white,
  },
  retryButtonText: {
    color: colors.accent.red,
    fontSize: 11,
    fontWeight: "700",
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
});

