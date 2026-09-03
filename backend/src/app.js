import express from "express";
import cors from "cors";
import merchantRoutes from "./routes/merchant.routes.js";
import productRoutes from "./routes/product.routes.js";
import buyerRoutes from "./routes/buyer.routes.js";
import negotiationRoutes from "./routes/negotiation.routes.js";
import quoteRoutes from "./routes/quote.routes.js";
import approvalRoutes from "./routes/approval.routes.js";
import paymentRoutes from "./routes/payment.routes.js";
import webhookRoutes from "./routes/webhook.routes.js";
import transactionRoutes from "./routes/transaction.routes.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();

app.use(cors());

// Raw body parser for webhook signature verification if needed
app.use(express.json({ limit: "10mb" }));

// Health Check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "EscrowAI backend" });
});

// Routes
app.use("/api/merchants", merchantRoutes);
app.use("/api/products", productRoutes);
app.use("/api/buyers", buyerRoutes);
app.use("/api/negotiations", negotiationRoutes);
app.use("/api/quotes", quoteRoutes);
app.use("/api/approvals", approvalRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/webhooks", webhookRoutes);
app.use("/api/transactions", transactionRoutes);

// Error Handler
app.use(errorHandler);

export default app;