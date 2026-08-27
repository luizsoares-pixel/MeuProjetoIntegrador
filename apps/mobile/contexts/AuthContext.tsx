import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { Session, User } from "@supabase/supabase-js";
import { router } from "expo-router";
import * as Linking from "expo-linking";
import { Alert } from "react-native";
import {
  mapAuthErrorMessage,
  ResetPasswordInput,
} from "@menu-digital/contracts";
import { supabase } from "../services/supabase";

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

type AuthContextData = {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isPasswordRecovery: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  requestPasswordRecovery: (email: string) => Promise<boolean>;
  updatePassword: (input: ResetPasswordInput) => Promise<boolean>;
  finishPasswordRecovery: () => void;
  signOut: () => Promise<void>;
};

// ---------------------------------------------------------------------------
// Contexto
// ---------------------------------------------------------------------------

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);

  async function handleRecoveryUrl(url: string | null) {
    if (!url) return;

    const hashParams = url.includes("#")
      ? new URLSearchParams(url.split("#")[1])
      : new URLSearchParams();
    const queryParams = url.includes("?")
      ? new URLSearchParams(url.split("?")[1].split("#")[0])
      : new URLSearchParams();
    const params = new URLSearchParams(hashParams);
    queryParams.forEach((value, key) => params.set(key, value));

    if (params.get("type") !== "recovery" && !params.get("code")) return;

    const code = params.get("code");
    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        Alert.alert("Link inválido", "Solicite uma nova recuperação de senha.");
        return;
      }

      setIsPasswordRecovery(true);
      return;
    }

    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");

    if (!accessToken || !refreshToken) return;

    setIsPasswordRecovery(true);

    const { error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    if (error) {
      setIsPasswordRecovery(false);
      Alert.alert("Link inválido", "Solicite uma nova recuperação de senha.");
      return;
    }
  }

  useEffect(() => {
    const linkSubscription = Linking.addEventListener("url", ({ url }) => {
      void handleRecoveryUrl(url);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (event === "PASSWORD_RECOVERY") {
        setIsPasswordRecovery(true);
      }
      setIsLoading(false);
    });

    async function initializeAuth() {
      try {
        // Processa o link antes de o guard decidir para qual tela navegar.
        const initialUrl = await Promise.race([
          Linking.getInitialURL(),
          new Promise<null>((resolve) => setTimeout(() => resolve(null), 2000)),
        ]);
        await handleRecoveryUrl(initialUrl);

        const sessionResult = await Promise.race([
          supabase.auth.getSession(),
          new Promise<null>((resolve) => setTimeout(() => resolve(null), 5000)),
        ]);

        if (sessionResult) {
          const {
            data: { session },
          } = sessionResult;
          setSession(session);
          setUser(session?.user ?? null);
        }
      } catch (error) {
        console.warn("Não foi possível restaurar a sessão:", error);
        setSession(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }

    void initializeAuth();

    return () => {
      subscription.unsubscribe();
      linkSubscription.remove();
    };
  }, []);

  // -------------------------------------------------------------------------
  // Ações
  // -------------------------------------------------------------------------

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      Alert.alert("Erro ao entrar", mapAuthErrorMessage(error.message));
      return;
    }

    router.replace("/home");
  }

  async function signUp(email: string, password: string) {
    const { error } = await supabase.auth.signUp({ email, password });

    if (error) {
      Alert.alert("Erro no cadastro", mapAuthErrorMessage(error.message));
      return;
    }

    Alert.alert("Sucesso", "Usuário cadastrado com sucesso!", [
      { text: "Ir para o Login", onPress: () => router.replace("/login") },
    ]);
  }

  async function requestPasswordRecovery(email: string) {
    const redirectTo = Linking.createURL("redefinir-senha");
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo,
    });

    if (error) {
      Alert.alert("Erro na recuperação", mapAuthErrorMessage(error.message));
      return false;
    }

    Alert.alert(
      "E-mail enviado",
      "Se o e-mail estiver cadastrado, enviaremos as instruções de recuperação."
    );
    return true;
  }

  async function updatePassword({ password }: ResetPasswordInput) {
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      Alert.alert("Erro ao redefinir senha", mapAuthErrorMessage(error.message));
      return false;
    }

    return true;
  }

  function finishPasswordRecovery() {
    setIsPasswordRecovery(false);
    router.replace("/home");
  }

  async function signOut() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        isPasswordRecovery,
        signIn,
        signUp,
        requestPasswordRecovery,
        updatePassword,
        finishPasswordRecovery,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useAuth(): AuthContextData {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }

  return context;
}
