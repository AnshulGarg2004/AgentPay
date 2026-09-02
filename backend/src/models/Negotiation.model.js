import mongoose from "mongoose";

const { Schema } = mongoose;

const OfferSchema = new Schema(
  {
    sender: { type: String, enum: ["BUYER_AGENT", "MERCHANT_AGENT", "POLICY_ENGINE"], required: true },
    action: { type: String, enum: ["OFFER", "COUNTER", "ACCEPT", "REJECT"], required: true },
    unitPriceInPaise: { type: Number, required: true },
    quantity: { type: Number, required: true },
    deliveryDays: { type: Number, default: 3 },
    reasoning: { type: String, default: "" },
    terms: { type: Schema.Types.Mixed, default: {} },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: true }
);

const NegotiationSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    merchantId: { type: Schema.Types.ObjectId, ref: "Merchant", required: true },
    buyerId: { type: Schema.Types.ObjectId, ref: "BuyerAgent" },
    status: {
      type: String,
      enum: ["OPEN", "AGREED", "REJECTED", "EXPIRED"],
      default: "OPEN",
    },
    agreedOffer: { type: Schema.Types.Mixed, default: null },
    quoteId: { type: Schema.Types.ObjectId, ref: "Quote", default: null },
    offers: [OfferSchema],
  },
  { timestamps: true }
);

export default mongoose.models.Negotiation || mongoose.model("Negotiation", NegotiationSchema);
