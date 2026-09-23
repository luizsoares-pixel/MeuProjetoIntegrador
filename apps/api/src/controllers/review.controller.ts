import { NextFunction, Request, Response } from "express";
import { reviewService } from "../services/review.service";

function actor(request: Request) {
  if (!request.user) throw new Error("AUTH_REQUIRED");
  return request.user;
}

function handleReviewError(error: any, response: Response, next: NextFunction) {
  if (error?.message === "AUTH_REQUIRED") {
    return response.status(401).json({ error: "Usuário não autenticado." });
  }
  if (error?.message === "REVIEW_REPLY_FORBIDDEN") {
    return response
      .status(403)
      .json({ error: "Apenas o proprietário do estabelecimento pode responder a esta avaliação." });
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
  return next(error);
}

export class ReviewController {
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
