import mongoose from "mongoose";

const { Schema } = mongoose;

const BulkDiscountSchema = new Schema(
  {
    minQty: { type: Number, required: true },
    discountPct: { type: Number, required: true },
  },
  { _id: false }
);

const ProductSchema = new Schema(
  {
    merchantId: { type: Schema.Types.ObjectId, ref: "Merchant", index: true, required: true },
    name: { type: String, required: true, trim: true },
    priceInPaise: { type: Number, required: true, min: 0 }, // store as integer paise
    inventory: { type: Number, required: true, default: 0, min: 0 },
    attributes: { type: Schema.Types.Mixed, default: {} }, // e.g. { color: ["black"], category: "chairs" }
    minPriceInPaise: { type: Number, required: true, min: 0 },
    bulkDiscounts: { type: [BulkDiscountSchema], default: [] },
    deliveryMinDays: { type: Number, default: 2 },
    deliveryMaxDays: { type: Number, default: 7 },
    warranty: { type: String, default: "1 year standard" },
    returnPolicyDays: { type: Number, default: 7 },
    aiPurchasable: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.models.Product || mongoose.model("Product", ProductSchema);
