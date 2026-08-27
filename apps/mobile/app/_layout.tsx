import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, View } from "react-native";

export default function Layout() {
  return (
    <>
      <StatusBar style="light" backgroundColor="#441010" />
      <View style={styles.topBar} />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "fade",
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
