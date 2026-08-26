const { Router } = require("express");

const { prisma } = require("../lib/prisma");
const { supabase } = require("../lib/supabase");
const { authenticate } = require("../middleware/authenticate");

const authRouter = Router();

function validateCredentials(email, password) {
  if (typeof email !== "string" || !email.includes("@")) {
    return "Informe um e-mail válido.";
  }

  if (typeof password !== "string" || password.length < 8) {
    return "A senha deve ter pelo menos 8 caracteres.";
  }

  return null;
}

authRouter.post("/register", async (request, response, next) => {
  const { email, password } = request.body;
  const validationError = validateCredentials(email, password);

  if (validationError) {
    return response.status(400).json({ error: validationError });
  }

  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      password,
      email_confirm: true,
    });

    if (error || !user) {
      return response.status(400).json({ error: error?.message ?? "Não foi possível criar o usuário." });
    }

    try {
      const profile = await prisma.user.create({
        data: {
          id: user.id,
          email: user.email,
        },
      });

      return response.status(201).json({
        user: {
          id: profile.id,
          email: profile.email,
        },
      });
    } catch (profileError) {
      await supabase.auth.admin.deleteUser(user.id);
      throw profileError;
    }
  } catch (error) {
    return next(error);
  }
});

authRouter.post("/login", async (request, response, next) => {
  const { email, password } = request.body;
  const validationError = validateCredentials(email, password);

  if (validationError) {
    return response.status(400).json({ error: validationError });
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (error || !data.session || !data.user) {
      return response.status(401).json({ error: "E-mail ou senha inválidos." });
    }

    return response.json({
      user: {
        id: data.user.id,
        email: data.user.email,
      },
      session: {
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
        expiresAt: data.session.expires_at,
      },
    });
  } catch (error) {
    return next(error);
  }
});

authRouter.get("/me", authenticate, async (request, response, next) => {
  try {
    const profile = await prisma.user.findUnique({
      where: { id: request.user.id },
    });

    return response.json({ user: profile ?? request.user });
  } catch (error) {
    return next(error);
  }
});

module.exports = { authRouter };