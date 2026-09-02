import express from "express";
import cors from "cors";
import merchantRoutes from "./routes/merchant.routes.js";
import productRoutes from "./routes/product.routes.js";
import buyerRoutes from "./routes/buyer.routes.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));

// Health Check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "AgentPay backend" });
});

// Phase 1 Routes
app.use("/api/merchants", merchantRoutes);
app.use("/api/products", productRoutes);
app.use("/api/buyers", buyerRoutes);

// Error Handler
app.use(errorHandler);

export default app;