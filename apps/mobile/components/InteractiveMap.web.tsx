import { StyleSheet, Text, View } from "react-native";
import { colors } from "../theme";

export default function InteractiveMap() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mapa disponível no aplicativo mobile</Text>
      <Text style={styles.description}>
        Abra o Menu Digital em um dispositivo Android ou iOS para explorar o mapa.
      </Text>
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
  title: {
    color: colors.accent.gold,
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
  },
  description: {
    maxWidth: 360,
    marginTop: 12,
    color: colors.accent.whiteSoft,
    fontSize: 15,
    textAlign: "center",
  },
});
