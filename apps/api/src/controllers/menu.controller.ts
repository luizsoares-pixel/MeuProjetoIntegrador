import { NextFunction, Request, Response } from "express";
import { menuService } from "../services/menu.service";

function actor(request: Request) {
  if (!request.user) throw new Error("AUTH_REQUIRED");
  return request.user;
}

function handleError(error: any, response: Response, next: NextFunction) {
  if (error?.message === "AUTH_REQUIRED") {
    return response.status(401).json({ error: "Usuário não autenticado." });
  }
  if (error?.message === "MENU_ITEM_FORBIDDEN") {
    return response.status(403).json({ error: "Você não pode alterar este cardápio." });
  }
  if (error?.message === "RESTAURANT_NOT_FOUND" || error?.message === "MENU_ITEM_NOT_FOUND") {
    return response.status(404).json({ error: "Recurso não encontrado." });
  }
  return next(error);
}

export class MenuController {
  async list(request: Request, response: Response, next: NextFunction) {
    try {
      const items = await menuService.list(String(request.params.id));
      return response.status(200).json({ items });
    } catch (error) {
      return handleError(error, response, next);
    }
  }

  async create(request: Request, response: Response, next: NextFunction) {
    try {
      const item = await menuService.create(String(request.params.id), request.body, actor(request));
      return response.status(201).json({ item });
    } catch (error) {
      return handleError(error, response, next);
    }
  }

  async update(request: Request, response: Response, next: NextFunction) {
    try {
      const item = await menuService.update(String(request.params.id), request.body, actor(request));
      return response.status(200).json({ item });
    } catch (error) {
      return handleError(error, response, next);
    }
  }

  async delete(request: Request, response: Response, next: NextFunction) {
    try {
      await menuService.delete(String(request.params.id), actor(request));
      return response.status(204).send();
    } catch (error) {
      return handleError(error, response, next);
    }
  }
}

export const menuController = new MenuController();