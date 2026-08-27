import { LoginInput, RegisterInput } from "@menu-digital/contracts";
import { prisma } from "../lib/prisma";
import { supabase } from "../lib/supabase";

export class AuthService {
  async register(credentials: RegisterInput) {
    const email = credentials.email.trim().toLowerCase();

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

    if (data.user.identities && data.user.identities.length === 0) {
      throw new Error("User already registered");
    }

    return {
      user: {
        id: data.user.id,
        email: data.user.email ?? email,
      },
      session: data.session
        ? {
            accessToken: data.session.access_token,
            refreshToken: data.session.refresh_token,
            expiresAt: data.session.expires_at,
          }
        : null,
    };
  }

  async login(credentials: LoginInput) {
    const email = credentials.email.trim().toLowerCase();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: credentials.password,
    });

    if (error || !data.session || !data.user) {
      throw new Error("CREDENTIALS_INVALID");
    }

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

  async getProfile(userId: string) {
    const profile = await prisma.user.findUnique({
      where: { id: userId },
    });

    return profile;
  }
}

export const authService = new AuthService();
