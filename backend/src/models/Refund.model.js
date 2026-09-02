import mongoose from "mongoose";

const { Schema } = mongoose;

const RefundSchema = new Schema(
  {
    transactionId: { type: Schema.Types.ObjectId, ref: "Transaction", required: true, index: true },
    amountInPaise: { type: Number, required: true, min: 1 },
    status: {
      type: String,
      enum: ["ELIGIBLE", "REQUIRES_APPROVAL", "PROCESSED", "REJECTED"],
      required: true,
      default: "ELIGIBLE",
    },
    reason: { type: String, required: true },
    razorpayRefundId: { type: String },
    approvedBy: { type: String },
    approvedAt: { type: Date },
    processedAt: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.models.Refund || mongoose.model("Refund", RefundSchema);
