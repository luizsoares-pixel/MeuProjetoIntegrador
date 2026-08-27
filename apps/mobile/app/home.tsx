import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useAuth } from "../hooks/useAuth";

export default function Home() {
  const { user, signOut } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Menu Digital</Text>

      {user?.email ? (
        <Text style={styles.userEmail}>{user.email}</Text>
      ) : null}

      <TouchableOpacity style={styles.logoutButton} onPress={signOut}>
        <Text style={styles.logoutText}>Sair</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#2f0000",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  title: {
    color: "#d4af37",
    fontSize: 24,
    fontWeight: "bold",
  },
  userEmail: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 13,
  },
  logoutButton: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.4)",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 32,
  },
  logoutText: {
    color: "#d4af37",
    fontWeight: "bold",
    fontSize: 14,
    letterSpacing: 1,
  },
});
