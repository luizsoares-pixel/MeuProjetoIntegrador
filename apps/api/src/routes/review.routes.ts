import { createReviewReplySchema } from "@menu-digital/contracts";
import { Router } from "express";
import { reviewController } from "../controllers/review.controller";
import { authMiddleware } from "../middlewares/auth";
import { validateRequest } from "../middleware/validateRequest";

export const reviewRouter = Router();

// POST /reviews/:id/reply
// Resposta do dono do restaurante a uma avaliação específica.
reviewRouter.post(
  "/:id/reply",
  authMiddleware,
  validateRequest(createReviewReplySchema),
  (request, response, next) => reviewController.reply(request, response, next)
);
