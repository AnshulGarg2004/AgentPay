import mongoose from "mongoose";

const { Schema } = mongoose;

const TransactionSchema = new Schema(
  {
    buyerId: { type: Schema.Types.ObjectId, ref: "BuyerAgent" },
    merchantId: { type: Schema.Types.ObjectId, ref: "Merchant", required: true },
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    quoteId: { type: Schema.Types.ObjectId, ref: "Quote" },
    amountInPaise: { type: Number, required: true, min: 0 },
    quantity: { type: Number, default: 1, min: 1 },
    unitPriceInPaise: { type: Number, required: true },
    state: {
      type: String,
      default: "AGREED",
      index: true,
    },
    riskLevel: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH"],
      default: "LOW",
    },
    riskScore: { type: Number, default: 10 },
    riskFactors: { type: [String], default: [] },
    approvalRequired: { type: Boolean, default: false },
    approvalReasons: { type: [String], default: [] },
    approvedBy: { type: String, default: null },
    approvedAt: { type: Date, default: null },
    rejectedBy: { type: String, default: null },
    rejectedAt: { type: Date, default: null },
    rejectionReason: { type: String, default: null },
    razorpayOrderId: { type: String, default: null },
    razorpayPaymentId: { type: String, default: null },
    idempotencyKey: { type: String, sparse: true },
  },
  { timestamps: true }
);

export default mongoose.models.Transaction || mongoose.model("Transaction", TransactionSchema);
