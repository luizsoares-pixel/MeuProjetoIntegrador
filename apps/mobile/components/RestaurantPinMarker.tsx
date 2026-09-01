import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, StyleSheet, View } from "react-native";
import { Marker } from "react-native-maps";
import { colors } from "../theme";
import type { NearbyRestaurant } from "../services/api";

interface RestaurantPinMarkerProps {
  restaurant: NearbyRestaurant;
  onPress: (restaurant: NearbyRestaurant) => void;
}

/**
 * Marker customizado para restaurantes no mapa.
 * tracksViewChanges={false} é crítico para performance —
 * evita re-render do Native View a cada frame do mapa.
 *
 * Design: pin dourado com ícone de garfo+faca, alinhado ao tema do app.
 */
export function RestaurantPinMarker({ restaurant, onPress }: RestaurantPinMarkerProps) {
  return (
    <Marker
      coordinate={{
        latitude: restaurant.latitude,
        longitude: restaurant.longitude,
      }}
      tracksViewChanges={false}
      onPress={() => onPress(restaurant)}
      accessibilityLabel={`Restaurante ${restaurant.name}`}
      accessibilityRole="button"
    >
      {/* Pressable apenas para o visual do pin — o toque é capturado pelo Marker */}
      <Pressable
        accessible={false}
      >
        <View style={styles.pinContainer}>
          <View style={styles.pinBody}>
            <MaterialCommunityIcons
              name="silverware-fork-knife"
              size={16}
              color={colors.background.primary}
            />
          </View>
          <View style={styles.pinTip} />
        </View>
      </Pressable>
    </Marker>
  );
}

const styles = StyleSheet.create({
  pinContainer: {
    alignItems: "center",
  },
  pinBody: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.accent.gold,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.background.primary,
    // Sombra (Android elevation, iOS shadow via boxShadow)
    elevation: 5,
    boxShadow: "0px 2px 6px rgba(0,0,0,0.35)",
  },
  pinTip: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: colors.accent.gold,
    marginTop: -1,
  },
});
