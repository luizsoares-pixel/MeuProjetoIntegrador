import { NextFunction, Request, Response } from "express";
import {
  CreateRestaurantInput,
  NearbyRestaurantsQuery,
} from "@menu-digital/contracts";
import { restaurantService } from "../services/restaurant.service";

export class RestaurantController {
  /**
   * GET /restaurants/nearby
   * Retorna restaurantes próximos à coordenada informada, ordenados por distância.
   */
  async findNearby(request: Request, response: Response, next: NextFunction) {
    try {
      // req.parsedQuery é populado pelo middleware validateQuery
      const query = (request as any).parsedQuery as NearbyRestaurantsQuery;
      const restaurants = await restaurantService.findNearby(query);
      return response.status(200).json({ restaurants });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * POST /restaurants
   * Cria um novo restaurante vinculado ao usuário autenticado (owner_id).
   */
  async create(request: Request, response: Response, next: NextFunction) {
    try {
      const ownerId = request.user?.id;
      if (!ownerId) {
        return response
          .status(401)
          .json({ error: "Usuário não autenticado." });
      }

      const body = request.body as CreateRestaurantInput;
      const restaurant = await restaurantService.create(body, ownerId);
      return response.status(201).json({ restaurant });
    } catch (error) {
      return next(error);
    }
  }
}

export const restaurantController = new RestaurantController();
