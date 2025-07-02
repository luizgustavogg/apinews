import express from "express";
import serverless from "serverless-http";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

app.get("/health", (req, res) => {
  return res.json({ status: "ok", timestamp: Date.now() });
});

app.get("/foo", (req, res) => {
  res.send("foo está funcionando!");
});

import userRoutes from "./user.js";
import noticeRoutes from "./notices.js";
import preferenceRoutes from "./preferences.js";

app.use("/users", userRoutes);
app.use("/notices", noticeRoutes);
app.use("/preferences", preferenceRoutes);

export default serverless(app);

