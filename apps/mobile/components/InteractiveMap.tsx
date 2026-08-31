import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Location from "expo-location";
import MapView, { UrlTile } from "react-native-maps";
import { colors } from "../theme";

const DEFAULT_REGION = {
  latitude: -23.55052,
  longitude: -46.633308,
  latitudeDelta: 0.08,
  longitudeDelta: 0.08,
};

const TILE_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const TILE_USER_AGENT = "MenuDigital/1.0 (mapa; contato: suporte@menudigital.app)";

export default function InteractiveMap() {
  const mapRef = useRef<MapView>(null);
  const [region, setRegion] = useState(DEFAULT_REGION);
  const [locationReady, setLocationReady] = useState(false);
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [tilesReady, setTilesReady] = useState(false);
  const [mapError, setMapError] = useState(false);

  const isLoading = !locationReady || (!tilesReady && !mapError) || (!mapReady && !mapError);

  function centerOnUser() {
    if (!locationEnabled) return;

    mapRef.current?.animateToRegion(region, 500);
  }

  useEffect(() => {
    let mounted = true;

    async function loadLocation() {
      try {
        const permission = await Location.requestForegroundPermissionsAsync();

        if (!mounted) return;

        if (permission.status !== Location.PermissionStatus.GRANTED) {
          setLocationReady(true);
          return;
        }

        setLocationEnabled(true);
        const currentLocation = await Location.getCurrentPositionAsync({});

        if (mounted) {
          setRegion((currentRegion) => ({
            ...currentRegion,
            latitude: currentLocation.coords.latitude,
            longitude: currentLocation.coords.longitude,
          }));
          setLocationReady(true);
        }
      } catch {
        if (mounted) setLocationReady(true);
      }
    }

    loadLocation();

    return () => {
      mounted = false;
    };
  }, []);

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
    if (mapReady && locationEnabled) {
      mapRef.current?.animateToRegion(region, 700);
    }
  }, [mapReady, locationEnabled, region]);

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
        accessibilityLabel="Mapa de restaurantes próximos"
      >
        <UrlTile
          urlTemplate={TILE_URL}
          maximumZ={19}
          flipY={false}
          urlHeaders={{ "User-Agent": TILE_USER_AGENT }}
        />
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

      {locationReady && !locationEnabled && !mapError ? (
        <View style={styles.infoBanner}>
          <MaterialCommunityIcons name="map-marker-off-outline" size={20} color={colors.accent.gold} />
          <Text style={styles.infoText}>Ative a localização para encontrar restaurantes perto de você.</Text>
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
  infoText: {
    color: colors.accent.white,
    textAlign: "center",
    fontSize: 13,
    flex: 1,
  },
});
