import { NextFunction, Request, Response } from "express";
import { supabase } from "../lib/supabase";

export interface AuthenticatedUser {
  id: string;
  email?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

/**
 * Middleware de Autenticação:
 * - Extrai o Bearer Token do cabeçalho Authorization.
 * - Valida o token remotamente via `supabase.auth.getUser(token)` para garantir
 *   que a sessão não foi revogada remotamente (não confia apenas em JWT local).
 * - Se válido, anexa `id` e `email` em `request.user`.
 * - Se inválido ou ausente, retorna HTTP 401.
 */
export async function authMiddleware(
  request: Request,
  response: Response,
  next: NextFunction
) {
  const authorization = request.headers.authorization;

  if (!authorization || !authorization.startsWith("Bearer ")) {
    return response
      .status(401)
      .json({ error: "Token de acesso não fornecido ou formato inválido." });
  }

  const token = authorization.slice("Bearer ".length).trim();

  if (!token) {
    return response
      .status(401)
      .json({ error: "Token de acesso ausente." });
  }

  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      return response
        .status(401)
        .json({ error: "Token de acesso inválido ou expirado." });
    }

    request.user = {
      id: user.id,
      email: user.email,
    };

    return next();
  } catch (_error) {
    return response
      .status(401)
      .json({ error: "Falha na validação do token de autenticação." });
  }
}

export const authenticate = authMiddleware;
