import { Stack } from "expo-router";
import { View, Text } from "react-native";

export default function Layout() {
  return (
    <>
      <View
        style={{
          height: 20,
          backgroundColor: "#441010",
          justifyContent: "center",
          paddingHorizontal: 20,
        }}
      >

      </View>

      <Stack
        screenOptions={{
          headerShown: false,
        }}
      />
    </>
  );
}