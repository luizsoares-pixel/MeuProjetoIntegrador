import { StyleSheet, Text, View } from "react-native";

export default function BuscarTab() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Buscar restaurantes</Text>
      <Text style={styles.description}>
        Em breve você poderá buscar por localização, cozinha e nome.
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
