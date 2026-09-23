import { NextFunction, Request, Response } from "express";
import { UploadService, uploadService } from "../services/upload.service";
import type { UploadPresignedUrlRequest } from "@menu-digital/contracts";

export class UploadController {
  constructor(private service: UploadService = uploadService) {}

  public get uploadService(): UploadService {
    return this.service;
  }

  public set uploadService(service: UploadService) {
    this.service = service;
  }

  getPresignedUrl = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const user = req.user;
      if (!user?.id) {
        res.status(401).json({
          error: "Usuário não autenticado. Token de acesso obrigatório.",
        });
        return;
      }

      const body = req.body as UploadPresignedUrlRequest;
      const result = await this.service.generatePresignedUrl({
        fileName: body.fileName,
        contentType: body.contentType,
        contentLength: body.contentLength,
        folder: body.folder,
        userId: user.id,
      });

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };
}

export const uploadController = new UploadController();
