import mongoose from "mongoose";

const { Schema } = mongoose;

const IdempotencyKeySchema = new Schema(
  {
    key: { type: String, required: true, unique: true, index: true },
    transactionId: { type: Schema.Types.ObjectId, ref: "Transaction" },
    status: { type: String, enum: ["IN_PROGRESS", "COMPLETED"], default: "IN_PROGRESS" },
    response: { type: Schema.Types.Mixed, default: null },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours TTL
      index: { expireAfterSeconds: 0 },
    },
  },
  { timestamps: true }
);

export default mongoose.models.IdempotencyKey || mongoose.model("IdempotencyKey", IdempotencyKeySchema);
