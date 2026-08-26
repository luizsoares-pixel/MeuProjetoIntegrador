require("dotenv").config();

const cors = require("cors");
const express = require("express");

const { authRouter } = require("./routes/auth");

const app = express();
const port = Number(process.env.PORT ?? 3333);

app.use(cors());
app.use(express.json());

app.get("/health", (_request, response) => {
  response.json({ status: "ok" });
});

app.use("/auth", authRouter);

app.use((error, _request, response, _next) => {
  console.error(error);
  response.status(500).json({ error: "Erro interno do servidor." });
});

app.listen(port, () => {
  console.log(`API disponível em http://localhost:${port}`);
});