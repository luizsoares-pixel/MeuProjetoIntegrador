import { LoginInput } from "@menu-digital/contracts";
import { prisma } from "../lib/prisma";
import { supabase } from "../lib/supabase";

export class AuthService {
  async login(credentials: LoginInput) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.email.trim().toLowerCase(),
      password: credentials.password,
    });

    if (error || !data.session || !data.user) {
      throw new Error("CREDENTIALS_INVALID");
    }

    return {
      user: {
        id: data.user.id,
        email: data.user.email,
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
