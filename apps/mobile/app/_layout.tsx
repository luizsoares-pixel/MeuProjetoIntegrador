import { Stack } from "expo-router";
import { StyleSheet, View } from "react-native";

export default function Layout() {
  return (
    <>
      <View style={styles.topBar} />
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  topBar: {
    height: 20,
    backgroundColor: "#441010",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
});
