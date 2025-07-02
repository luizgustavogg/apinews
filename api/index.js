import express from "express";
import serverless from "serverless-http";
import dotenv from "dotenv";

import userRoutes from "./user.js";
import noticeRoutes from "./notices.js";
import preferenceRoutes from "./preferences.js";

dotenv.config();

const app = express();
app.use(express.json());

app.get("/health", (req, res) => {
  return res.json({ status: "ok", timestamp: Date.now() });
});

import redis from "../libs/redis.js";
import prisma from "../libs/prisma.js";

app.get("/debug", async (req, res) => {
  try {
    const redisCheck = await redis.get("qualquer-coisa");
    const userCount = await prisma.user.count();
    res.json({ redisCheck, userCount });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});


app.use("/users", userRoutes);
app.use("/notices", noticeRoutes);
app.use("/preferences", preferenceRoutes);

export default serverless(app);

