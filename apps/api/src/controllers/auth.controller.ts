import { mapAuthErrorMessage } from "@menu-digital/contracts";
import { NextFunction, Request, Response } from "express";
import { AuthenticatedRequest } from "../middlewares/auth";
import { authService } from "../services/auth.service";

export class AuthController {
  async register(request: Request, response: Response, next: NextFunction) {
    try {
      const result = await authService.register(request.body);
      return response.status(201).json(result);
    } catch (error) {
      if (error instanceof Error) {
        const msg = error.message.toLowerCase();
        if (
          msg.includes("already registered") ||
          msg.includes("user_already_exists") ||
          msg.includes("duplicate key")
        ) {
          return response
            .status(409)
            .json({ error: mapAuthErrorMessage(error.message) });
        }

        return response
          .status(400)
          .json({ error: mapAuthErrorMessage(error.message) });
      }

      return next(error);
    }
  }

  async login(request: Request, response: Response, next: NextFunction) {
    try {
      const result = await authService.login(request.body);
      return response.status(200).json(result);
    } catch (error) {
      if (error instanceof Error && error.message === "CREDENTIALS_INVALID") {
        return response
          .status(401)
          .json({ error: "E-mail ou senha inválidos." });
      }

      if (error instanceof Error) {
        return response
          .status(400)
          .json({ error: mapAuthErrorMessage(error.message) });
      }

      return next(error);
    }
  }

  async requestPasswordRecovery(
    request: Request,
    response: Response,
    next: NextFunction
  ) {
    try {
      const result = await authService.requestPasswordRecovery(request.body);
      return response.status(200).json(result);
    } catch (error) {
      if (error instanceof Error) {
        return response
          .status(400)
          .json({ error: mapAuthErrorMessage(error.message) });
      }

      return next(error);
    }
  }

  async me(
    request: AuthenticatedRequest,
    response: Response,
    next: NextFunction
  ) {
    try {
      const userId = request.user?.id;

      if (!userId) {
        return response.status(401).json({ error: "Não autenticado." });
      }

      const profile = await authService.getProfile(userId);

      if (!profile) {
        return response.status(404).json({ error: "Usuário não encontrado." });
      }

      return response.status(200).json({ user: profile });
    } catch (error) {
      return next(error);
    }
  }
}

export const authController = new AuthController();
