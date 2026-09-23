import {
  createRestaurantSchema,
  createMenuItemSchema,
  createReviewSchema,
  listRestaurantsQuerySchema,
  listReviewsQuerySchema,
  nearbyRestaurantsSchema,
  restaurantRouteQuerySchema,
  updateRestaurantProfileSchema,
} from "@menu-digital/contracts";
import { Router } from "express";
import { restaurantController } from "../controllers/restaurant.controller";
import { menuController } from "../controllers/menu.controller";
import { reviewController } from "../controllers/review.controller";
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

// GET /restaurants/me
// Retorna os dados completos do restaurante do usuário logado.
restaurantRouter.get(
  "/me",
  authMiddleware,
  (req, res, next) => {
    restaurantController.getProfile(req, res, next);
  }
);

// PUT /restaurants/me
// Atualiza as informações cadastrais e perfil do restaurante do usuário logado.
restaurantRouter.put(
  "/me",
  authMiddleware,
  validateRequest(updateRestaurantProfileSchema),
  (req, res, next) => {
    restaurantController.updateProfile(req, res, next);
  }
);

// GET /restaurants?page=&limit=
// Retorna a listagem paginada de restaurantes ordenados por data decrescente.
restaurantRouter.get(
  "/",
  validateQuery(listRestaurantsQuerySchema),
  (req, res, next) => {
    restaurantController.list(req, res, next);
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

// GET /restaurants/:id/menu
restaurantRouter.get("/:id/menu", (req, res, next) => {
  menuController.list(req, res, next);
});

// POST /restaurants/:id/menu — somente o owner restaurant pode cadastrar itens.
restaurantRouter.post(
  "/:id/menu",
  authMiddleware,
  validateRequest(createMenuItemSchema),
  (req, res, next) => menuController.create(req, res, next)
);

// GET /restaurants/:id/route?lat=&lng=&profile=
// Calcula a rota e tempo estimado entre a localização informada e o restaurante (HU9).
restaurantRouter.get(
  "/:id/route",
  validateQuery(restaurantRouteQuerySchema),
  (req, res, next) => {
    restaurantController.getRoute(req, res, next);
  }
);

// GET /restaurants/:id
// Retorna os dados completos de um restaurante específico por ID.
restaurantRouter.get(
  "/:id",
  (req, res, next) => {
    restaurantController.getById(req, res, next);
  }
);

// GET /restaurants/:id/reviews
// Lista avaliações paginadas do restaurante com metadados e distribuição de estrelas.
restaurantRouter.get(
  "/:id/reviews",
  validateQuery(listReviewsQuerySchema),
  (req, res, next) => {
    reviewController.listRestaurantReviews(req, res, next);
  }
);

// POST /restaurants/:id/reviews
// Envia avaliação para o restaurante e recalcula médias atomicamente.
restaurantRouter.post(
  "/:id/reviews",
  authMiddleware,
  validateRequest(createReviewSchema),
  (req, res, next) => {
    reviewController.createRestaurantReview(req, res, next);
  }
);

