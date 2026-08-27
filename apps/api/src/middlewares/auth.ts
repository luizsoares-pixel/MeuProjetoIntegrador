import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

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
    return response.status(401).json({ error: "Token de acesso ausente." });
  }

  const jwtSecret = process.env.SUPABASE_JWT_SECRET;
  if (!jwtSecret) {
    return response
      .status(500)
      .json({ error: "Chave secreta JWT não configurada no servidor." });
  }

  try {
    const decoded = jwt.verify(token, jwtSecret) as JwtPayload;

    const sub = decoded.sub;
    if (!sub || typeof sub !== "string") {
      return response
        .status(401)
        .json({ error: "Token de acesso inválido: identificador ausente." });
    }

    request.user = {
      id: sub,
      email: typeof decoded.email === "string" ? decoded.email : undefined,
    };

    return next();
  } catch (_error) {
    return response
      .status(401)
      .json({ error: "Token de acesso inválido ou expirado." });
  }
}

export const authenticate = authMiddleware;
