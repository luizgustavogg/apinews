// /api/index.js
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

export default serverless(app);