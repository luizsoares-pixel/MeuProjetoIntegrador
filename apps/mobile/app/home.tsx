import { StyleSheet, Text, View } from "react-native";

export default function Home() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>HOME</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#2f0000",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    color: "#d4af37",
    fontSize: 24,
    fontWeight: "bold",
  },
});
