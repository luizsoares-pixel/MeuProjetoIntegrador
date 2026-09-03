import { z } from "zod";

// ── Restaurants ────────────────────────────────────────────────────────────────

export const nearbyRestaurantsSchema = z.object({
  lat: z
    .string({ required_error: "O parâmetro 'lat' é obrigatório." })
    .refine((v) => v.trim() !== "", { message: "O parâmetro 'lat' não pode ser vazio." })
    .transform(Number)
    .refine((v) => !isNaN(v) && v >= -90 && v <= 90, {
      message: "O parâmetro 'lat' deve ser um número entre -90 e 90.",
    }),
  lng: z
    .string({ required_error: "O parâmetro 'lng' é obrigatório." })
    .refine((v) => v.trim() !== "", { message: "O parâmetro 'lng' não pode ser vazio." })
    .transform(Number)
    .refine((v) => !isNaN(v) && v >= -180 && v <= 180, {
      message: "O parâmetro 'lng' deve ser um número entre -180 e 180.",
    }),
  radius: z
    .string()
    .optional()
    .transform((v) => (v !== undefined ? Number(v) : 5000))
    .refine((v) => !isNaN(v) && v > 0, {
      message: "O parâmetro 'radius' deve ser um número positivo (metros).",
    }),
});

export type NearbyRestaurantsQuery = z.infer<typeof nearbyRestaurantsSchema>;

export const createRestaurantSchema = z.object({
  name: z
    .string({ required_error: "O nome do restaurante é obrigatório." })
    .trim()
    .min(2, "O nome do restaurante deve ter pelo menos 2 caracteres."),
  address: z
    .string({ required_error: "O endereço é obrigatório." })
    .trim()
    .min(3, "O endereço deve ter pelo menos 3 caracteres."),
  cuisineType: z
    .string({ required_error: "O tipo de culinária é obrigatório." })
    .trim()
    .min(2, "Informe o tipo de culinária."),
  latitude: z
    .number({ required_error: "A latitude é obrigatória." })
    .min(-90, "Latitude deve ser entre -90 e 90.")
    .max(90, "Latitude deve ser entre -90 e 90."),
  longitude: z
    .number({ required_error: "A longitude é obrigatória." })
    .min(-180, "Longitude deve ser entre -180 e 180.")
    .max(180, "Longitude deve ser entre -180 e 180."),
  imageUrl: z
    .string()
    .url("A URL da imagem deve ser válida.")
    .nullable()
    .optional(),
});

export type CreateRestaurantInput = z.infer<typeof createRestaurantSchema>;

export interface RestaurantResponse {
  id: string;
  name: string;
  address: string;
  cuisineType?: string | null;
  imageUrl: string | null;
  latitude: number;
  longitude: number;
  distanceInMeters?: number;
  ownerId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface NearbyRestaurantResponse extends RestaurantResponse {
  distanceInMeters: number;
}

// ── Auth ───────────────────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email: z
    .string({ required_error: "O e-mail é obrigatório." })
    .trim()
    .min(1, "O e-mail é obrigatório.")
    .email("Informe um e-mail válido."),
  password: z.string({ required_error: "A senha é obrigatória." }).min(1, "A senha é obrigatória."),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  email: z
    .string({ required_error: "O e-mail é obrigatório." })
    .trim()
    .min(1, "O e-mail é obrigatório.")
    .email("Informe um e-mail válido."),
  password: z
    .string({ required_error: "A senha é obrigatória." })
    .min(8, "A senha deve ter pelo menos 8 caracteres."),
});

export type RegisterInput = z.infer<typeof registerSchema>;

export const registerFormSchema = registerSchema
  .extend({
    confirmPassword: z
      .string({ required_error: "A confirmação da senha é obrigatória." })
      .min(1, "Confirme a senha."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem.",
    path: ["confirmPassword"],
  });

export type RegisterFormInput = z.infer<typeof registerFormSchema>;

export const passwordRecoverySchema = z.object({
  email: z
    .string({ required_error: "O e-mail é obrigatório." })
    .trim()
    .min(1, "O e-mail é obrigatório.")
    .email("Informe um e-mail válido."),
});

export type PasswordRecoveryInput = z.infer<typeof passwordRecoverySchema>;

export const resetPasswordSchema = z
  .object({
    password: z
      .string({ required_error: "A nova senha é obrigatória." })
      .min(8, "A senha deve ter pelo menos 8 caracteres."),
    confirmPassword: z
      .string({ required_error: "A confirmação da senha é obrigatória." })
      .min(1, "Confirme a nova senha."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem.",
    path: ["confirmPassword"],
  });

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export interface UserResponse {
  id: string;
  email: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export function mapAuthErrorMessage(errorMessage?: string | null): string {
  if (!errorMessage) {
    return "Ocorreu um erro inesperado. Tente novamente.";
  }

  const msg = errorMessage.toLowerCase();

  if (
    msg.includes("user already registered") ||
    msg.includes("already registered") ||
    msg.includes("user_already_exists") ||
    msg.includes("duplicate key")
  ) {
    return "E-mail já cadastrado.";
  }

  if (
    msg.includes("invalid login credentials") ||
    msg.includes("invalid_credentials") ||
    msg.includes("invalid grant")
  ) {
    return "Credenciais inválidas.";
  }

  if (msg.includes("email not confirmed") || msg.includes("email_not_confirmed")) {
    return "E-mail ainda não confirmado.";
  }

  if (
    msg.includes("password should be at least") ||
    msg.includes("weak_password")
  ) {
    return "A senha deve ter pelo menos 8 caracteres.";
  }

  if (
    msg.includes("network") ||
    msg.includes("fetch") ||
    msg.includes("connection") ||
    msg.includes("failed to fetch")
  ) {
    return "Falha de conexão com o servidor. Verifique sua internet.";
  }

  return errorMessage;
}
