import { NextFunction, Request, Response } from "express";
import { ZodError, ZodSchema } from "zod";

/**
 * Valida `req.query` contra um schema Zod.
 * Em caso de sucesso, substitui `req.query` pelos dados parseados/transformados.
 * Retorna 400 com detalhes de validação em caso de falha.
 */
export function validateQuery(schema: ZodSchema) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = await schema.parseAsync(req.query);
      // Zod transforma os valores (string → number), então substituímos req.query
      (req as any).parsedQuery = parsed;
      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        const details = error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        }));

        return res.status(400).json({
          error: "Parâmetros de consulta inválidos.",
          details,
        });
      }
      return next(error);
    }
  };
}
