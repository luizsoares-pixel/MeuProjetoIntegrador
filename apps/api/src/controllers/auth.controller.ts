import { NextFunction, Request, Response } from "express";
import { AuthenticatedRequest } from "../middleware/authenticate";
import { authService } from "../services/auth.service";

export class AuthController {
  async login(request: Request, response: Response, next: NextFunction) {
    try {
      const result = await authService.login(request.body);
      return response.json(result);
    } catch (error) {
      if (error instanceof Error && error.message === "CREDENTIALS_INVALID") {
        return response
          .status(401)
          .json({ error: "E-mail ou senha inválidos." });
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
      if (!request.user?.id) {
        return response.status(401).json({ error: "Não autenticado." });
      }

      const profile = await authService.getProfile(request.user.id);
      return response.json({ user: profile ?? request.user });
    } catch (error) {
      return next(error);
    }
  }
}

export const authController = new AuthController();
