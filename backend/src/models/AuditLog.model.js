import mongoose from "mongoose";

const { Schema } = mongoose;

const AuditLogSchema = new Schema(
  {
    transactionId: { type: Schema.Types.ObjectId, ref: "Transaction", index: true },
    action: { type: String, required: true },
    reason: { type: String, required: true },
    actor: {
      type: String,
      enum: ["BUYER_AGENT", "MERCHANT_AGENT", "POLICY_ENGINE", "HUMAN"],
      required: true,
    },
    result: { type: String, default: "SUCCESS" },
    metadata: { type: Schema.Types.Mixed },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.models.AuditLog || mongoose.model("AuditLog", AuditLogSchema);
