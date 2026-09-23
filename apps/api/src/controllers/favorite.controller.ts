import { NextFunction, Request, Response } from "express";
import { favoriteService } from "../services/favorite.service";

function actor(request: Request) {
  if (!request.user) throw new Error("AUTH_REQUIRED");
  return request.user;
}

function handleFavoriteError(error: any, response: Response, next: NextFunction) {
  if (error?.message === "AUTH_REQUIRED") {
    return response.status(401).json({ error: "Usuário não autenticado." });
  }
  if (
    error?.message === "RESTAURANT_NOT_FOUND" ||
    error?.message === "MENU_ITEM_NOT_FOUND"
  ) {
    return response.status(404).json({ error: "Recurso não encontrado." });
  }
  return next(error);
}

export class FavoriteController {
  async toggleRestaurant(
    request: Request,
    response: Response,
    next: NextFunction
  ) {
    try {
      const result = await favoriteService.toggleRestaurantFavorite(
        String(request.params.id),
        actor(request)
      );
      return response.status(200).json(result);
    } catch (error) {
      return handleFavoriteError(error, response, next);
    }
  }

  async toggleDish(
    request: Request,
    response: Response,
    next: NextFunction
  ) {
    try {
      const result = await favoriteService.toggleDishFavorite(
        String(request.params.id),
        actor(request)
      );
      return response.status(200).json(result);
    } catch (error) {
      return handleFavoriteError(error, response, next);
    }
  }

  async list(
    request: Request,
    response: Response,
    next: NextFunction
  ) {
    try {
      const result = await favoriteService.listUserFavorites(actor(request));
      return response.status(200).json(result);
    } catch (error) {
      return handleFavoriteError(error, response, next);
    }
  }
}

export const favoriteController = new FavoriteController();
