import express from "express";
import cors from "cors";
import proxyRoutes from "./routes/proxy.routes";
import { errorHandler } from "./middlewares/error.middleware";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api", proxyRoutes);

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "postmaster-proxy" });
});

app.use(errorHandler);

export default app;
