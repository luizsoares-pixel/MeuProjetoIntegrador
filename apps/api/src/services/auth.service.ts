import {
  LoginInput,
  PasswordRecoveryInput,
  RegisterInput,
  RegisterRestaurantInput,
} from "@menu-digital/contracts";
import { prisma } from "../lib/prisma";
import { supabase, supabaseAdmin } from "../lib/supabase";
import { restaurantService } from "./restaurant.service";

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

  async registerRestaurant(credentials: RegisterRestaurantInput) {
    const email = credentials.email.trim().toLowerCase();
    const cnpj = credentials.restaurant.cnpj.replace(/\D/g, "");

    const existingRestaurant = await prisma.restaurant.findUnique({
      where: { cnpj },
    });

    if (existingRestaurant) {
      throw new Error("CNPJ_ALREADY_REGISTERED");
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password: credentials.password,
      options: { data: { role: "restaurant" } },
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

    const userId = data.user.id;

    try {
      await prisma.user.upsert({
        where: { id: userId },
        update: { role: "restaurant" },
        create: {
          id: userId,
          email,
          role: "restaurant",
        },
      });

      await supabaseAdmin.auth.admin.updateUserById(userId, {
        app_metadata: { role: "restaurant" },
      });

      const restaurant = await restaurantService.create(
        { ...credentials.restaurant, cnpj },
        userId
      );

      return {
        user: {
          id: userId,
          email: data.user.email ?? email,
          role: "restaurant" as const,
        },
        restaurant,
        session: data.session
          ? {
              accessToken: data.session.access_token,
              refreshToken: data.session.refresh_token,
              expiresAt: data.session.expires_at,
            }
          : null,
      };
    } catch (registrationError) {
      await supabaseAdmin.auth.admin.deleteUser(userId);
      throw registrationError;
    }
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
        role: profile?.role ?? "user",
      },
      session: {
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
        expiresAt: data.session.expires_at,
      },
    };
  }

  async requestPasswordRecovery(credentials: PasswordRecoveryInput) {
    const email = credentials.email.trim().toLowerCase();
    const { error } = await supabase.auth.resetPasswordForEmail(email);

    if (error) {
      throw error;
    }

    return { message: "Se o e-mail estiver cadastrado, enviaremos as instruções de recuperação." };
  }

  async getProfile(userId: string) {
    const profile = await prisma.user.findUnique({
      where: { id: userId },
    });

    return profile;
  }
}

export const authService = new AuthService();
