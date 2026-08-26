import { LoginInput, RegisterInput } from "@menu-digital/contracts";
import { prisma } from "../lib/prisma";
import { supabase, supabaseAdmin } from "../lib/supabase";

export class AuthService {
  /**
   * Registra um novo usuário integrando Supabase Auth e Prisma.
   * Em caso de falha na criação do perfil no Prisma (Dual Write Problem),
   * executa uma transação compensatória excluindo o usuário criado no Supabase Auth.
   */
  async register(credentials: RegisterInput) {
    const email = credentials.email.trim().toLowerCase();

    // 1. Cria o usuário no Supabase Auth usando o cliente público
    const { data, error } = await supabase.auth.signUp({
      email,
      password: credentials.password,
    });

    if (error) {
      throw error;
    }

    if (!data.user || !data.user.id) {
      throw new Error("AUTH_SIGNUP_FAILED");
    }

    // Detecta caso do Supabase Auth onde usuário já existia (identities vazio)
    if (data.user.identities && data.user.identities.length === 0) {
      throw new Error("User already registered");
    }

    const userId = data.user.id;

    // 2. Tenta persistir o perfil no banco local (Prisma)
    try {
      const user = await prisma.user.create({
        data: {
          id: userId,
          email: data.user.email ?? email,
        },
      });

      return {
        user: {
          id: user.id,
          email: user.email,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
        session: data.session
          ? {
              accessToken: data.session.access_token,
              refreshToken: data.session.refresh_token,
              expiresAt: data.session.expires_at,
            }
          : null,
      };
    } catch (prismaError) {
      // 3. Transação Compensatória: remove usuário órfão no Supabase Auth via Admin Client
      try {
        await supabaseAdmin.auth.admin.deleteUser(userId);
      } catch (rollbackError) {
        console.error(
          `[CompensatingTransaction] Falha crítica ao deletar usuário órfão (${userId}) no Supabase Auth:`,
          rollbackError
        );
      }

      const dualWriteError = new Error("DUAL_WRITE_FAILED");
      (dualWriteError as unknown as { cause: unknown }).cause = prismaError;
      throw dualWriteError;
    }
  }

  /**
   * Autentica o usuário no Supabase Auth e retorna a sessão junto com os dados do Prisma.
   */
  async login(credentials: LoginInput) {
    const email = credentials.email.trim().toLowerCase();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: credentials.password,
    });

    if (error || !data.session || !data.user) {
      throw new Error("CREDENTIALS_INVALID");
    }

    // Busca os dados complementares do perfil no Prisma
    const profile = await prisma.user.findUnique({
      where: { id: data.user.id },
    });

    return {
      user: {
        id: profile?.id ?? data.user.id,
        email: profile?.email ?? data.user.email ?? email,
        createdAt: profile?.createdAt,
        updatedAt: profile?.updatedAt,
      },
      session: {
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
        expiresAt: data.session.expires_at,
      },
    };
  }

  /**
   * Recupera o perfil do usuário pelo seu ID único (UUID).
   */
  async getProfile(userId: string) {
    const profile = await prisma.user.findUnique({
      where: { id: userId },
    });

    return profile;
  }
}

export const authService = new AuthService();
