import {
  createMenuItemSchema,
  createReviewSchema,
  listReviewsQuerySchema,
  updateMenuItemSchema,
} from "@menu-digital/contracts";
import { Router } from "express";
import { menuController } from "../controllers/menu.controller";
import { reviewController } from "../controllers/review.controller";
import { favoriteController } from "../controllers/favorite.controller";
import { authMiddleware } from "../middlewares/auth";
import { validateQuery } from "../middleware/validateQuery";
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

// POST /menu-items/:id/reviews
// Envia avaliação para o prato e recalcula médias atomicamente.
menuRouter.post(
  "/:id/reviews",
  authMiddleware,
  validateRequest(createReviewSchema),
  (request, response, next) =>
    reviewController.createMenuItemReview(request, response, next)
);

// GET /menu-items/:id/reviews
// Lista avaliações paginadas do prato com distribuição de notas.
menuRouter.get(
  "/:id/reviews",
  validateQuery(listReviewsQuerySchema),
  (request, response, next) =>
    reviewController.listMenuItemReviews(request, response, next)
);

// POST /menu-items/:id/favorite (e alias /toggle)
// Alterna o estado de favorito do prato para o usuário autenticado.
menuRouter.post(
  "/:id/favorite",
  authMiddleware,
  (request, response, next) =>
    favoriteController.toggleDish(request, response, next)
);

menuRouter.post(
  "/:id/favorite/toggle",
  authMiddleware,
  (request, response, next) =>
    favoriteController.toggleDish(request, response, next)
);

// GET /menu-items/:id
// Retorna os dados completos do prato, incluindo média e contagem de avaliações.
menuRouter.get("/:id", (request, response, next) =>
  menuController.getById(request, response, next)
);