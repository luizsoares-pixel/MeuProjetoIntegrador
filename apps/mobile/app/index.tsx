import { Image, StyleSheet, Text, View, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

// Tela exibida enquanto o AuthProvider resolve a sessão inicial.
// O redirecionamento é responsabilidade do RootNavigator em _layout.tsx.
export default function AppSplash() {
  return (
    <LinearGradient
      colors={["#2f0000", "#4a0505", "#700000"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <View style={styles.content}>
        <Image
          source={require("../assets/logo.png")}
          style={styles.logo}
          resizeMode="contain"
          accessibilityLabel="Logo Menu Digital"
        />

        <Text style={styles.title}>Menu</Text>
        <View style={styles.divider} />
        <Text style={styles.subtitle}>DIGITAL</Text>
        <Text style={styles.tagline}>Seu cardápio na palma da mão</Text>
      </View>

      <View style={styles.loadingContainer}>
        <ActivityIndicator
          size="large"
          color="#d4af37"
          accessibilityLabel="Carregando aplicativo"
        />
        <Text style={styles.loadingText}>Carregando...</Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
  logo: {
    width: 160,
    height: 160,
    marginBottom: 24,
  },
  title: {
    color: "#d4af37",
    fontSize: 48,
    fontWeight: "bold",
    letterSpacing: 2,
  },
  divider: {
    width: 80,
    height: 2,
    backgroundColor: "#d4af37",
    marginVertical: 8,
  },
  subtitle: {
    color: "#FFF",
    fontSize: 16,
    letterSpacing: 5,
  },
  tagline: {
    color: "#d8c184",
    marginTop: 10,
    fontSize: 14,
  },
  loadingContainer: {
    paddingBottom: 60,
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    color: "rgba(212,175,55,0.7)",
    fontSize: 13,
    letterSpacing: 1,
  },
});
