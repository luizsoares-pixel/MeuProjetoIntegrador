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

  /**
   * GET /restaurants/me
   * Retorna os dados completos do restaurante do usuário logado.
   */
  async getProfile(request: Request, response: Response, next: NextFunction) {
    try {
      const ownerId = request.user?.id;
      if (!ownerId) {
        return response
          .status(401)
          .json({ error: "Usuário não autenticado." });
      }

      const restaurant = await restaurantService.getProfile(ownerId);
      if (!restaurant) {
        return response
          .status(404)
          .json({ error: "Restaurante não encontrado para este usuário." });
      }

      return response.status(200).json({ restaurant });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * PUT /restaurants/me
   * Atualiza as informações de perfil do restaurante do usuário logado.
   */
  async updateProfile(request: Request, response: Response, next: NextFunction) {
    try {
      const ownerId = request.user?.id;
      if (!ownerId) {
        return response
          .status(401)
          .json({ error: "Usuário não autenticado." });
      }

      const restaurant = await restaurantService.updateProfile(ownerId, request.body);
      return response.status(200).json({ restaurant });
    } catch (error: any) {
      if (error?.message === "RESTAURANT_NOT_FOUND") {
        return response
          .status(404)
          .json({ error: "Restaurante não encontrado para este usuário." });
      }
      return next(error);
    }
  }

  /**
   * GET /restaurants/:id
   * Retorna os dados completos de um restaurante específico por ID.
   */
  async getById(request: Request, response: Response, next: NextFunction) {
    try {
      const { id } = request.params;
      const restaurant = await restaurantService.getById(id);
      if (!restaurant) {
        return response
          .status(404)
          .json({ error: "Restaurante não encontrado." });
      }

      return response.status(200).json({ restaurant });
    } catch (error) {
      return next(error);
    }
  }
}

export const restaurantController = new RestaurantController();

