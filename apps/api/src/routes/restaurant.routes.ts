import { nearbyRestaurantsSchema } from "@menu-digital/contracts";
import { Router } from "express";
import { restaurantController } from "../controllers/restaurant.controller";
import { validateQuery } from "../middleware/validateQuery";

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
