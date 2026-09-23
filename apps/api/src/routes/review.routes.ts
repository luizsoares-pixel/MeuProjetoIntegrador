import {
  createReviewReplySchema,
  createReviewSchema,
  getMyReviewQuerySchema,
  reportReviewSchema,
  updateReviewSchema,
} from "@menu-digital/contracts";
import { Router } from "express";
import { reviewController } from "../controllers/review.controller";
import { authMiddleware } from "../middlewares/auth";
import { validateQuery } from "../middleware/validateQuery";
import { validateRequest } from "../middleware/validateRequest";

export const reviewRouter = Router();

// GET /reviews/me?restaurantId=&menuItemId=
// Consulta se o usuário autenticado já possui avaliação ativa para restaurante ou prato.
reviewRouter.get(
  "/me",
  authMiddleware,
  validateQuery(getMyReviewQuerySchema),
  (request, response, next) => reviewController.getMyReview(request, response, next)
);

// POST /reviews
// Criação de nova avaliação (restaurante ou prato) com recálculo atômico das médias.
reviewRouter.post(
  "/",
  authMiddleware,
  validateRequest(createReviewSchema),
  (request, response, next) => reviewController.create(request, response, next)
);

// PUT /reviews/:id
// Edição da própria avaliação (nota, comentário e fotos) e recálculo atômico.
reviewRouter.put(
  "/:id",
  authMiddleware,
  validateRequest(updateReviewSchema),
  (request, response, next) => reviewController.update(request, response, next)
);

// DELETE /reviews/:id
// Exclusão da própria avaliação e recálculo atômico.
reviewRouter.delete(
  "/:id",
  authMiddleware,
  (request, response, next) => reviewController.delete(request, response, next)
);

// POST /reviews/:id/report
// Registro de denúncia de avaliação de terceiros para moderação manual.
reviewRouter.post(
  "/:id/report",
  authMiddleware,
  validateRequest(reportReviewSchema),
  (request, response, next) => reviewController.report(request, response, next)
);

// POST /reviews/:id/reply
// Resposta do dono do restaurante a uma avaliação específica.
reviewRouter.post(
  "/:id/reply",
  authMiddleware,
  validateRequest(createReviewReplySchema),
  (request, response, next) => reviewController.reply(request, response, next)
);
