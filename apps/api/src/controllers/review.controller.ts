import { NextFunction, Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { reviewService } from "../services/review.service";

function actor(request: Request) {
  if (!request.user) throw new Error("AUTH_REQUIRED");
  return request.user;
}

function handleReviewError(error: any, response: Response, next: NextFunction) {
  if (error?.message === "AUTH_REQUIRED") {
    return response.status(401).json({ error: "Usuário não autenticado." });
  }
  if (
    error?.message === "REVIEW_REPLY_FORBIDDEN" ||
    error?.message === "REVIEW_FORBIDDEN"
  ) {
    return response
      .status(403)
      .json({ error: "Você não tem permissão para realizar esta ação." });
  }
  if (
    error?.message === "MENU_ITEM_NOT_FOUND" ||
    error?.message === "RESTAURANT_NOT_FOUND" ||
    error?.message === "REVIEW_NOT_FOUND"
  ) {
    return response.status(404).json({ error: "Recurso não encontrado." });
  }
  if (error?.message === "REVIEW_ALREADY_EXISTS") {
    return response
      .status(409)
      .json({ error: "Você já enviou uma avaliação para este item." });
  }
  if (error?.message === "CANNOT_REPORT_OWN_REVIEW") {
    return response
      .status(400)
      .json({ error: "Você não pode denunciar sua própria avaliação." });
  }
  if (error?.message === "TARGET_REQUIRED") {
    return response
      .status(400)
      .json({ error: "Informe restaurantId ou menuItemId para esta operação." });
  }
  // Colisão de constraint única do Prisma (race condition ou duplicata não capturada pelo findUnique)
  if (
    (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") ||
    error?.code === "P2002"
  ) {
    return response
      .status(409)
      .json({ error: "Você já enviou uma avaliação para este item." });
  }
  return next(error);
}

export class ReviewController {
  async getMyReview(
    request: Request,
    response: Response,
    next: NextFunction
  ) {
    try {
      const query = (request as any).parsedQuery ?? request.query;
      const review = await reviewService.getMyReview(actor(request), {
        restaurantId: query.restaurantId ? String(query.restaurantId) : undefined,
        menuItemId: query.menuItemId ? String(query.menuItemId) : undefined,
      });
      return response.status(200).json({ review });
    } catch (error) {
      return handleReviewError(error, response, next);
    }
  }

  async create(
    request: Request,
    response: Response,
    next: NextFunction
  ) {
    try {
      const review = await reviewService.createReview(request.body, actor(request));
      return response.status(201).json({ review });
    } catch (error) {
      return handleReviewError(error, response, next);
    }
  }

  async update(
    request: Request,
    response: Response,
    next: NextFunction
  ) {
    try {
      const review = await reviewService.updateReview(
        String(request.params.id),
        request.body,
        actor(request)
      );
      return response.status(200).json({ review });
    } catch (error) {
      return handleReviewError(error, response, next);
    }
  }

  async delete(
    request: Request,
    response: Response,
    next: NextFunction
  ) {
    try {
      await reviewService.deleteReview(String(request.params.id), actor(request));
      return response.status(200).json({ message: "Avaliação excluída com sucesso." });
    } catch (error) {
      return handleReviewError(error, response, next);
    }
  }

  async report(
    request: Request,
    response: Response,
    next: NextFunction
  ) {
    try {
      const report = await reviewService.reportReview(
        String(request.params.id),
        request.body,
        actor(request)
      );
      return response.status(201).json({ report });
    } catch (error) {
      return handleReviewError(error, response, next);
    }
  }

  async createRestaurantReview(
    request: Request,
    response: Response,
    next: NextFunction
  ) {
    try {
      const review = await reviewService.createRestaurantReview(
        String(request.params.id),
        request.body,
        actor(request)
      );
      return response.status(201).json({ review });
    } catch (error) {
      return handleReviewError(error, response, next);
    }
  }

  async listRestaurantReviews(
    request: Request,
    response: Response,
    next: NextFunction
  ) {
    try {
      const query = (request as any).parsedQuery ?? request.query;
      const result = await reviewService.listRestaurantReviews(
        String(request.params.id),
        query
      );
      return response.status(200).json(result);
    } catch (error) {
      return handleReviewError(error, response, next);
    }
  }

  async createMenuItemReview(
    request: Request,
    response: Response,
    next: NextFunction
  ) {
    try {
      const review = await reviewService.createMenuItemReview(
        String(request.params.id),
        request.body,
        actor(request)
      );
      return response.status(201).json({ review });
    } catch (error) {
      return handleReviewError(error, response, next);
    }
  }

  async listMenuItemReviews(
    request: Request,
    response: Response,
    next: NextFunction
  ) {
    try {
      const query = (request as any).parsedQuery ?? request.query;
      const result = await reviewService.listMenuItemReviews(
        String(request.params.id),
        query
      );
      return response.status(200).json(result);
    } catch (error) {
      return handleReviewError(error, response, next);
    }
  }

  async reply(request: Request, response: Response, next: NextFunction) {
    try {
      const review = await reviewService.replyReview(
        String(request.params.id),
        request.body,
        actor(request)
      );
      return response.status(200).json({ review });
    } catch (error) {
      return handleReviewError(error, response, next);
    }
  }
}

export const reviewController = new ReviewController();
