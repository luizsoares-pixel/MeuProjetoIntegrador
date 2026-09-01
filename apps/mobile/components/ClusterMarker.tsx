import { Pressable, StyleSheet, Text, View } from "react-native";
import { Marker } from "react-native-maps";
import { colors } from "../theme";

interface ClusterMarkerProps {
  id: number;
  coordinate: { latitude: number; longitude: number };
  count: number;
  onPress: () => void;
}

/**
 * Marker visual para grupos de pins próximos.
 *
 * O tamanho do bubble escala com a contagem para dar indicação visual
 * da densidade do cluster:
 *   - 1–9   → 40 px (pequeno)
 *   - 10–99 → 48 px (médio)
 *   - 100+  → 56 px (grande, label "99+")
 *
 * tracksViewChanges={false} é obrigatório — evita re-render do Native View
 * a cada frame do mapa (mesmo princípio do RestaurantPinMarker).
 */
export function ClusterMarker({
  id,
  coordinate,
  count,
  onPress,
}: ClusterMarkerProps) {
  const size = count > 99 ? 56 : count > 9 ? 48 : 40;
  const label = count > 99 ? "99+" : String(count);

  return (
    <Marker
      key={`cluster-${id}`}
      coordinate={coordinate}
      tracksViewChanges={false}
      onPress={onPress}
      accessibilityLabel={`Grupo de ${count} restaurantes. Toque para expandir.`}
      accessibilityRole="button"
    >
      {/* Pressable apenas como container visual — toque capturado pelo Marker */}
      <Pressable accessible={false}>
        <View
          style={[
            styles.bubble,
            { width: size, height: size, borderRadius: size / 2 },
          ]}
        >
          <Text style={styles.count} numberOfLines={1}>
            {label}
          </Text>
        </View>
      </Pressable>
    </Marker>
  );
}

const styles = StyleSheet.create({
  bubble: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.accent.gold,
    borderWidth: 2.5,
    borderColor: colors.background.primary,
    elevation: 6,
    boxShadow: "0px 3px 8px rgba(0,0,0,0.40)",
  },
  count: {
    color: colors.background.primary,
    fontWeight: "800",
    fontSize: 13,
    lineHeight: 16,
  },
});
