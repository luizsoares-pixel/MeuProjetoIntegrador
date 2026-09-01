import { NextFunction, Request, Response } from "express";
import { NearbyRestaurantsQuery } from "@menu-digital/contracts";
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
}

export const restaurantController = new RestaurantController();
