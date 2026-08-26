import { loginSchema } from "@menu-digital/contracts";
import { Router } from "express";
import { authController } from "../controllers/auth.controller";
import { authenticate } from "../middleware/authenticate";
import { validateRequest } from "../middleware/validateRequest";

export const authRouter = Router();

authRouter.post(
  "/login",
  validateRequest(loginSchema),
  (req, res, next) => {
    authController.login(req, res, next);
  }
);

authRouter.get(
  "/me",
  authenticate,
  (req, res, next) => {
    authController.me(req, res, next);
  }
);
