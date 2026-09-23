import { Router } from "express";
import { favoriteController } from "../controllers/favorite.controller";
import { authMiddleware } from "../middlewares/auth";

export const favoriteRouter = Router();

// POST /favorites/restaurants/:id/toggle
// Alterna estado de favorito do restaurante para o usuário logado.
favoriteRouter.post(
  "/restaurants/:id/toggle",
  authMiddleware,
  (request, response, next) =>
    favoriteController.toggleRestaurant(request, response, next)
);

// POST /favorites/dishes/:id/toggle
// Alterna estado de favorito do prato (menu-item) para o usuário logado.
favoriteRouter.post(
  "/dishes/:id/toggle",
  authMiddleware,
  (request, response, next) =>
    favoriteController.toggleDish(request, response, next)
);

// GET /favorites
// Retorna a lista de restaurantes e pratos favoritados pelo usuário logado.
favoriteRouter.get("/", authMiddleware, (request, response, next) =>
  favoriteController.list(request, response, next)
);
