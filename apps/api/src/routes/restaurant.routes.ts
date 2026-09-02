import {
  createRestaurantSchema,
  nearbyRestaurantsSchema,
} from "@menu-digital/contracts";
import { Router } from "express";
import { restaurantController } from "../controllers/restaurant.controller";
import { authMiddleware } from "../middlewares/auth";
import { validateQuery } from "../middleware/validateQuery";
import { validateRequest } from "../middleware/validateRequest";

export const restaurantRouter = Router();

// GET /restaurants/nearby?lat=&lng=&radius=
// Retorna restaurantes próximos à coordenada informada, ordenados por distância crescente.
restaurantRouter.get(
  "/nearby",
  validateQuery(nearbyRestaurantsSchema),
  (req, res, next) => {
    restaurantController.findNearby(req, res, next);
  }
);

// POST /restaurants
// Cria um novo restaurante vinculado ao usuário autenticado (owner_id).
restaurantRouter.post(
  "/",
  authMiddleware,
  validateRequest(createRestaurantSchema),
  (req, res, next) => {
    restaurantController.create(req, res, next);
  }
);
