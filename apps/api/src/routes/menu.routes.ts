import {
  createMenuItemSchema,
  updateMenuItemSchema,
} from "@menu-digital/contracts";
import { Router } from "express";
import { menuController } from "../controllers/menu.controller";
import { authMiddleware } from "../middlewares/auth";
import { validateRequest } from "../middleware/validateRequest";

export const menuRouter = Router();

menuRouter.patch(
  "/:id",
  authMiddleware,
  validateRequest(updateMenuItemSchema),
  (request, response, next) => menuController.update(request, response, next)
);

menuRouter.delete(
  "/:id",
  authMiddleware,
  (request, response, next) => menuController.delete(request, response, next)
);