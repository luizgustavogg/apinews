// /api/index.js
import express from "express";
import serverless from "serverless-http";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

// ROTA DE TESTE: agora /health em vez de /api/health
app.get("/health", (req, res) => {
  return res.json({ status: "ok", timestamp: Date.now() });
});

// ⬇️ Exemplo de outras rotas (sem “/api” na frente)
app.get("/foo", (req, res) => {
  res.send("foo está funcionando!");
});

// Se você quiser agrupar usuários, notices, preferences, basta importar os routers
import userRoutes from "./user.js";
import noticeRoutes from "./notices.js";
import preferenceRoutes from "./preferences.js";

app.use("/users", userRoutes);
app.use("/notices", noticeRoutes);
app.use("/preferences", preferenceRoutes);

// NÃO coloque “/api” aqui nem nas rotas internas,
// porque o Vercel já faz o mapping de /api/(.*) → /api/index.js
export default serverless(app);
