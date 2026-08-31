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

const DEFAULT_REGION = {
  latitude: -23.55052,
  longitude: -46.633308,
  latitudeDelta: 0.08,
  longitudeDelta: 0.08,
};

const TILE_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const TILE_USER_AGENT = "MenuDigital/1.0 (mapa; contato: suporte@menudigital.app)";

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
    setLocationReady(false);
    setLocationState("loading");
    setUserLocation(null);

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

      setUserLocation(nextUserLocation);
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
        showsCompass={false}
        showsScale={false}
        rotateEnabled={false}
        onMapReady={() => setMapReady(true)}
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
});
