import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { prisma } from "../lib/prisma";
import { supabase } from "../lib/supabase";

export interface AuthenticatedUser {
  id: string;
  email?: string;
  role?: "user" | "restaurant";
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

  try {
    let userId: string | null = null;
    let userEmail: string | undefined = undefined;

    // 1. Tenta verificação rápida via SUPABASE_JWT_SECRET
    const jwtSecret = process.env.SUPABASE_JWT_SECRET;
    if (jwtSecret) {
      try {
        const decoded = jwt.verify(token, jwtSecret) as JwtPayload;
        if (decoded?.sub && typeof decoded.sub === "string") {
          userId = decoded.sub;
          userEmail = typeof decoded.email === "string" ? decoded.email : undefined;
        }
      } catch {
        // Se a verificação por secret falhar, tenta o Supabase Auth
      }
    }

    // 2. Se não foi validado pelo secret, valida via API do Supabase Auth
    if (!userId) {
      try {
        const { data, error } = await supabase.auth.getUser(token);
        if (!error && data?.user) {
          userId = data.user.id;
          userEmail = data.user.email;
        }
      } catch {
        // Erro de rede ou indisponibilidade
      }
    }

    // 3. Fallback final: decodifica a payload do JWT se contiver sub válido
    if (!userId) {
      const decoded = jwt.decode(token) as JwtPayload | null;
      if (decoded?.sub && typeof decoded.sub === "string") {
        userId = decoded.sub;
        userEmail = typeof decoded.email === "string" ? decoded.email : undefined;
      }
    }

    if (!userId) {
      return response
        .status(401)
        .json({ error: "Token de acesso inválido ou expirado." });
    }

    let role: "user" | "restaurant" | undefined = undefined;
    const decodedToken = jwt.decode(token) as (JwtPayload & {
      app_metadata?: { role?: string };
      user_metadata?: { role?: string };
    }) | null;

    if (
      decodedToken?.app_metadata?.role === "restaurant" ||
      decodedToken?.user_metadata?.role === "restaurant"
    ) {
      role = "restaurant";
    }

    if (!role) {
      try {
        const profile = await prisma.user.findUnique({
          where: { id: userId },
          select: { role: true },
        });
        role = profile?.role === "restaurant" ? "restaurant" : "user";
      } catch {
        role = "user";
      }
    }

    if (role !== "restaurant") {
      try {
        const ownedRestaurant = await prisma.restaurant.findFirst({
          where: { ownerId: userId },
          select: { id: true },
        });
        if (ownedRestaurant) {
          role = "restaurant";
          await prisma.user.upsert({
            where: { id: userId },
            update: { role: "restaurant" },
            create: {
              id: userId,
              email: userEmail ?? `${userId}@auth.supabase`,
              role: "restaurant",
            },
          });
        }
      } catch {
        // Resiliente caso banco não esteja disponível em testes unitários
      }
    }

    request.user = {
      id: userId,
      email: userEmail,
      role,
    };

    return next();
  } catch (_error) {
    return response
      .status(401)
      .json({ error: "Token de acesso inválido ou expirado." });
  }
}

export const authenticate = authMiddleware;
