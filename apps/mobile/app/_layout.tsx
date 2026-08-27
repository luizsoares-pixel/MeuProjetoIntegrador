import { Stack, router, usePathname } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import { AuthProvider } from "../contexts/AuthContext";
import { useAuth } from "../hooks/useAuth";
import { colors } from "../theme";

// Mantém a splash screen nativa visível até a sessão ser resolvida
SplashScreen.preventAutoHideAsync();

// ---------------------------------------------------------------------------
// Guard de rotas: redireciona conforme estado de autenticação
// ---------------------------------------------------------------------------

const publicRoutes = ["/login", "/cadastro", "/recuperar-senha"];

function RootNavigator() {
  const { session, isLoading, isPasswordRecovery } = useAuth();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;

    SplashScreen.hideAsync();

    if (isPasswordRecovery && session) {
      if (pathname !== "/redefinir-senha") {
        router.replace("/redefinir-senha");
      }
    } else if (session) {
      if (publicRoutes.includes(pathname) || pathname === "/") {
        router.replace("/home");
      }
    } else {
      if (!publicRoutes.includes(pathname)) {
        router.replace("/login");
      }
    }
  }, [session, isLoading, isPasswordRecovery, pathname]);

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
      <StatusBar style="light" backgroundColor={colors.background.dark} />
      <View style={styles.topBar} />
      <RootNavigator />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  topBar: {
    height: 20,
    backgroundColor: colors.background.dark,
    justifyContent: "center",
    paddingHorizontal: 20,
  },
});
