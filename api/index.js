import express from "express";
import serverless from "serverless-http";

import userRoutes from "./user.js";
import noticeRoutes from "./notices.js";
import preferenceRoutes from "./preferences.js";

const app = express();
app.use(express.json());

app.use("/users", userRoutes);
app.use("/notices", noticeRoutes);
app.use("/preferences", preferenceRoutes);

const handlerRaw = serverless(app);

export const handler = async (event, context) => {
  try {
    return await handlerRaw(event, context);
  } catch (err) {
    console.error("ERRO NO HANDLER:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Erro interno no servidor" }),
    };
  }
};
