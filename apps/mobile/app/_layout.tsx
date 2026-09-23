import { Stack, router, useSegments, useRootNavigationState } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "../contexts/AuthContext";
import { FavoritesProvider } from "../contexts/FavoritesContext";
import { useAuth } from "../hooks/useAuth";
import { colors } from "../theme";

// Mantém a splash screen nativa visível até a sessão ser resolvida
SplashScreen.preventAutoHideAsync();

// ---------------------------------------------------------------------------
// Guard de rotas: redireciona conforme estado de autenticação
// ---------------------------------------------------------------------------

const publicRoutes = ["/login", "/cadastro", "/recuperar-senha"];

function RouteGuard() {
  const { session, isLoading, isPasswordRecovery } = useAuth();
  const segments = useSegments();
  const rootNavigationState = useRootNavigationState();

  useEffect(() => {
    if (!rootNavigationState?.key || isLoading) return;

    SplashScreen.hideAsync();

    const currentPath = `/${segments.join("/")}`;

    if (isPasswordRecovery && session) {
      if (currentPath !== "/redefinir-senha") {
        router.replace("/redefinir-senha");
      }
    } else if (session) {
      if (publicRoutes.includes(currentPath) || currentPath === "/" || currentPath === "/(tabs)") {
        router.replace("/home");
      }
    } else {
      if (!publicRoutes.includes(currentPath)) {
        router.replace("/login");
      }
    }
  }, [session, isLoading, isPasswordRecovery, segments, rootNavigationState?.key]);

  return null;
}

// ---------------------------------------------------------------------------
// Layout raiz: envolve tudo no SafeAreaProvider e AuthProvider
// ---------------------------------------------------------------------------

export default function Layout() {
  return (
    <SafeAreaProvider style={{ flex: 1, backgroundColor: colors.background.primary }}>
      <AuthProvider>
        <FavoritesProvider>
          <StatusBar style="light" />
          <RouteGuard />
          <Stack
            screenOptions={{
              headerShown: false,
              animation: "fade",
            }}
          />
        </FavoritesProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

