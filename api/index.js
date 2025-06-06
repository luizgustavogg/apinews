import express from "express";
import serverless from "serverless-http";
import dotenv from "dotenv";

dotenv.config();

const app = express();

// ROTA DE TESTE EXTREMAMENTE SIMPLES:
app.get("/health", (req, res) => {
  return res.json({ status: "ok", timestamp: Date.now() });
});

export default serverless(app);
