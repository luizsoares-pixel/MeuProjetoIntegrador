import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useAuth } from "../../hooks/useAuth";

export default function PerfilTab() {
  const { user, signOut } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Seu perfil</Text>
      <Text style={styles.email}>{user?.email ?? "Usuário"}</Text>
      <TouchableOpacity
        accessibilityRole="button"
        onPress={signOut}
        style={styles.button}
      >
        <Text style={styles.buttonText}>Sair</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    backgroundColor: "#2f0000",
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  title: { color: "#fff", fontSize: 26, fontWeight: "700" },
  email: { color: "rgba(255,255,255,0.7)", fontSize: 15, marginTop: 12 },
  button: {
    borderColor: "rgba(212,175,55,0.5)",
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 28,
    paddingHorizontal: 36,
    paddingVertical: 12,
  },
  buttonText: { color: "#d4af37", fontSize: 14, fontWeight: "700" },
});
