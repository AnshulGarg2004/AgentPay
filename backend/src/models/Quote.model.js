import mongoose from "mongoose";

const { Schema } = mongoose;

const QuoteSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    merchantId: { type: Schema.Types.ObjectId, ref: "Merchant", required: true },
    buyerId: { type: Schema.Types.ObjectId, ref: "BuyerAgent" },
    unitPriceInPaise: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    subtotalInPaise: { type: Number, required: true, min: 0 },
    deliveryDays: { type: Number, default: 3 },
    terms: { type: Schema.Types.Mixed, default: {} },
    status: {
      type: String,
      enum: ["ACTIVE", "EXPIRED", "ACCEPTED", "REJECTED"],
      default: "ACTIVE",
    },
    expiresAt: { type: Date, required: true, index: true },
  },
  { timestamps: true }
);

export default mongoose.models.Quote || mongoose.model("Quote", QuoteSchema);
