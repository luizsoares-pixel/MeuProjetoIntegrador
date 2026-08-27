import { StyleSheet, Text, View } from "react-native";

export default function MapaTab() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Restaurantes no mapa</Text>
      <Text style={styles.description}>
        Encontre opções próximas de você e explore os restaurantes da região.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#2f0000",
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  title: { color: "#fff", fontSize: 26, fontWeight: "700" },
  description: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 16,
    lineHeight: 24,
    marginTop: 12,
  },
});