import express from "express";
import cors from "cors";
import merchantRoutes from "./routes/merchant.routes.js";
import productRoutes from "./routes/product.routes.js";
import buyerRoutes from "./routes/buyer.routes.js";
import negotiationRoutes from "./routes/negotiation.routes.js";
import quoteRoutes from "./routes/quote.routes.js";
import approvalRoutes from "./routes/approval.routes.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));

// Health Check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "AgentPay backend" });
});

// Phase 1, Phase 3, Phase 4 Routes
app.use("/api/merchants", merchantRoutes);
app.use("/api/products", productRoutes);
app.use("/api/buyers", buyerRoutes);
app.use("/api/negotiations", negotiationRoutes);
app.use("/api/quotes", quoteRoutes);
app.use("/api/approvals", approvalRoutes);

// Error Handler
app.use(errorHandler);

export default app;