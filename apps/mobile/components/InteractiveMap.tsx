import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
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
  const [region, setRegion] = useState(DEFAULT_REGION);
  const [locationReady, setLocationReady] = useState(false);
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [tilesReady, setTilesReady] = useState(false);
  const [mapError, setMapError] = useState(false);

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

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={region}
        showsUserLocation={locationEnabled}
        showsMyLocationButton={locationEnabled}
        onMapReady={() => setMapReady(true)}
        accessibilityLabel="Mapa de restaurantes próximos"
      >
        <UrlTile urlTemplate={TILE_URL} maximumZ={19} flipY={false} />
      </MapView>

      {!locationReady || !tilesReady || (!mapReady && !mapError) ? (
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
          <Text style={styles.infoText}>
            Ative a localização para centralizar o mapa em você.
          </Text>
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
    padding: 12,
    borderRadius: 8,
    backgroundColor: colors.background.dark,
  },
  infoText: {
    color: colors.accent.white,
    textAlign: "center",
    fontSize: 13,
  },
});
