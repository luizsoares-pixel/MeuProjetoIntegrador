import { StyleSheet, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "../theme";

export default function InteractiveMap() {
  return (
    <View style={styles.container}>
      <View style={styles.illustration}>
        <View style={styles.roadVertical} />
        <View style={styles.roadHorizontal} />
        <View style={styles.pin}>
          <MaterialCommunityIcons name="map-marker" size={36} color={colors.accent.white} />
        </View>
      </View>
      <View style={styles.content}>
        <Text style={styles.eyebrow}>EXPLORAR</Text>
        <Text style={styles.title}>Restaurantes próximos</Text>
        <Text style={styles.description}>
          O mapa interativo está disponível no aplicativo Android ou iOS.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: colors.background.primary,
  },
  illustration: {
    width: 210,
    height: 210,
    marginBottom: 26,
    overflow: "hidden",
    borderRadius: 105,
    backgroundColor: "#eadfca",
    borderWidth: 10,
    borderColor: colors.accent.goldTint,
    position: "relative",
  },
  roadVertical: {
    position: "absolute",
    width: 42,
    height: 250,
    left: 82,
    top: -20,
    transform: [{ rotate: "18deg" }],
    backgroundColor: "#fffaf0",
  },
  roadHorizontal: {
    position: "absolute",
    width: 250,
    height: 34,
    left: -20,
    top: 90,
    transform: [{ rotate: "-12deg" }],
    backgroundColor: "#fffaf0",
  },
  pin: {
    position: "absolute",
    left: 75,
    top: 75,
    width: 60,
    height: 60,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 30,
    backgroundColor: colors.background.primary,
    borderWidth: 3,
    borderColor: colors.accent.gold,
  },
  content: {
    alignItems: "center",
    maxWidth: 380,
  },
  eyebrow: {
    color: colors.accent.goldMuted,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 2,
  },
  title: {
    marginTop: 6,
    color: colors.accent.gold,
    fontSize: 25,
    fontWeight: "700",
    textAlign: "center",
  },
  description: {
    marginTop: 14,
    color: colors.accent.whiteSoft,
    fontSize: 16,
    lineHeight: 23,
    textAlign: "center",
  },
});
