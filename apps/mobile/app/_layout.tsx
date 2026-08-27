import { Stack, router } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import { AuthProvider, useAuth } from "../contexts/AuthContext";

// Mantém a splash screen nativa visível até a sessão ser resolvida
SplashScreen.preventAutoHideAsync();

// ---------------------------------------------------------------------------
// Guard de rotas: redireciona conforme estado de autenticação
// ---------------------------------------------------------------------------

function RootNavigator() {
  const { session, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    SplashScreen.hideAsync();

    if (session) {
      router.replace("/home");
    } else {
      router.replace("/login");
    }
  }, [session, isLoading]);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "fade",
      }}
    />
  );
}

// ---------------------------------------------------------------------------
// Layout raiz: envolve tudo no AuthProvider
// ---------------------------------------------------------------------------

export default function Layout() {
  return (
    <AuthProvider>
      <StatusBar style="light" backgroundColor="#441010" />
      <View style={styles.topBar} />
      <RootNavigator />
    </AuthProvider>
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
