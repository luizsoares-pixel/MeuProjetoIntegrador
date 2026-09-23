import { Router } from "express";
import { uploadPresignedUrlRequestSchema } from "@menu-digital/contracts";
import { uploadController } from "../controllers/upload.controller";
import { authMiddleware } from "../middlewares/auth";
import { validateRequest } from "../middleware/validateRequest";

const router = Router();

router.post(
  "/presigned-url",
  authMiddleware,
  validateRequest(uploadPresignedUrlRequestSchema),
  uploadController.getPresignedUrl
);

export { router as uploadRouter };
