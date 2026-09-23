import "dotenv/config";
import cors from "cors";
import express, { NextFunction, Request, Response } from "express";
import { authRouter } from "./routes/auth.routes";
import { restaurantRouter } from "./routes/restaurant.routes";
import { menuRouter } from "./routes/menu.routes";
import { reviewRouter } from "./routes/review.routes";
import { favoriteRouter } from "./routes/favorite.routes";
import { uploadRouter } from "./routes/upload.routes";

const app = express();
const port = Number(process.env.PORT ?? 3333);

app.use(cors());
app.use(express.json());

app.get("/health", (_request: Request, response: Response) => {
  response.json({ status: "ok" });
});

app.use("/auth", authRouter);
app.use("/restaurants", restaurantRouter);
app.use("/menu-items", menuRouter);
app.use("/reviews", reviewRouter);
app.use("/favorites", favoriteRouter);
app.use("/upload", uploadRouter);


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

if (process.env.NODE_ENV !== "test") {
  const host = process.env.HOST ?? "0.0.0.0";
  app.listen(port, host, () => {
    console.log(`API disponível em http://${host}:${port} (Rede Local e Localhost)`);
  });
}

export default app;
