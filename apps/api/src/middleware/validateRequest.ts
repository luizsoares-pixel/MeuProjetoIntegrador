import { NextFunction, Request, Response } from "express";
import { ZodError, ZodSchema } from "zod";

export function validateRequest(schema: ZodSchema) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = await schema.parseAsync(req.body);
      req.body = parsed;
      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        const details = error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        }));

        return res.status(400).json({
          error: "Erro de validação nos dados enviados.",
          details,
        });
      }
      return next(error);
    }
  };
}
