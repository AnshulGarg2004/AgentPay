import mongoose from "mongoose";

const { Schema } = mongoose;

const WebhookEventSchema = new Schema(
  {
    eventId: { type: String, required: true, unique: true, index: true },
    transactionId: { type: Schema.Types.ObjectId, ref: "Transaction" },
    type: { type: String, required: true },
    payload: { type: Schema.Types.Mixed },
    processedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.models.WebhookEvent || mongoose.model("WebhookEvent", WebhookEventSchema);
