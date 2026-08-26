import "dotenv/config";
import cors from "cors";
import express, { NextFunction, Request, Response } from "express";
import { authRouter } from "./routes/auth.routes";

const app = express();
const port = Number(process.env.PORT ?? 3333);

app.use(cors());
app.use(express.json());

app.get("/health", (_request: Request, response: Response) => {
  response.json({ status: "ok" });
});

app.use("/auth", authRouter);

// Global Error Handler
app.use(
  (
    error: unknown,
    _request: Request,
    response: Response,
    _next: NextFunction
  ) => {
    console.error(error);
    response.status(500).json({ error: "Erro interno do servidor." });
  }
);

app.listen(port, () => {
  console.log(`API disponível em http://localhost:${port}`);
});

export default app;
