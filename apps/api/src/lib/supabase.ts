import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.SUPABASE_URL ??
  process.env.EXPO_PUBLIC_SUPABASE_URL ??
  "https://placeholder.supabase.co";

const supabaseAnonKey =
  process.env.SUPABASE_ANON_KEY ??
  process.env.EXPO_PUBLIC_SUPABASE_KEY ??
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
  "dummy-anon-key";

const supabaseServiceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  "dummy-service-role-key";

if (
  !process.env.SUPABASE_URL &&
  !process.env.EXPO_PUBLIC_SUPABASE_URL
) {
  console.warn("Aviso: SUPABASE_URL não configurada no ambiente.");
}

if (
  !process.env.SUPABASE_ANON_KEY &&
  !process.env.EXPO_PUBLIC_SUPABASE_KEY &&
  !process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
) {
  console.warn("Aviso: SUPABASE_ANON_KEY não configurada no ambiente.");
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.warn(
    "Aviso: SUPABASE_SERVICE_ROLE_KEY não configurada no ambiente."
  );
}

/**
 * Cliente Público do Supabase:
 * Utiliza a SUPABASE_ANON_KEY para autenticação padrão (signUp, signIn, getUser).
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

/**
 * Cliente Admin do Supabase:
 * Utiliza a SUPABASE_SERVICE_ROLE_KEY com privilégios administrativos
 * exclusivamente para contornar o RLS e executar operações como a
 * transação compensatória (deleteUser) no caso de falha de dual-write.
 */
export const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseServiceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export const supabaseClient = supabase;
