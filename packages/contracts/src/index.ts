import { z } from "zod";

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
