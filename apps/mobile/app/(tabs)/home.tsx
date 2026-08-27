import { StyleSheet, Text, View } from "react-native";
import { useAuth } from "../../hooks/useAuth";

export default function HomeTab() {
  const { user } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>MENU DIGITAL</Text>
      <Text style={styles.title}>Encontre seu próximo sabor</Text>
      <Text style={styles.description}>
        Restaurantes e cardápios para explorar durante a sua viagem.
      </Text>
      {user?.email ? <Text style={styles.userEmail}>{user.email}</Text> : null}
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
  eyebrow: {
    color: "#d4af37",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 2,
    marginBottom: 12,
  },
  title: {
    color: "#fff",
    fontSize: 30,
    fontWeight: "700",
    lineHeight: 38,
    maxWidth: 320,
  },
  description: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 16,
    lineHeight: 24,
    marginTop: 14,
    maxWidth: 340,
  },
  userEmail: {
    color: "rgba(255,255,255,0.48)",
    fontSize: 12,
    marginTop: 32,
  },
});
