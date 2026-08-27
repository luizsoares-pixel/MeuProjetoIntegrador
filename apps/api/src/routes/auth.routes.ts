import {
  loginSchema,
  passwordRecoverySchema,
  registerSchema,
} from "@menu-digital/contracts";
import { Router } from "express";
import { authController } from "../controllers/auth.controller";
import { authMiddleware } from "../middlewares/auth";
import { validateRequest } from "../middleware/validateRequest";

export const authRouter = Router();

// POST /auth/register - Cadastro de usuário com validação de esquema e transação compensatória
authRouter.post(
  "/register",
  validateRequest(registerSchema),
  (req, res, next) => {
    authController.register(req, res, next);
  }
);

// POST /auth/login - Autenticação com e-mail e senha
authRouter.post(
  "/login",
  validateRequest(loginSchema),
  (req, res, next) => {
    authController.login(req, res, next);
  }
);

// POST /auth/password-recovery - Solicitação de recuperação por e-mail
authRouter.post(
  "/password-recovery",
  validateRequest(passwordRecoverySchema),
  (req, res, next) => {
    authController.requestPasswordRecovery(req, res, next);
  }
);

// GET /auth/me - Rota protegida para obtenção dos dados do usuário autenticado
authRouter.get(
  "/me",
  authMiddleware,
  (req, res, next) => {
    authController.me(req, res, next);
  }
);
