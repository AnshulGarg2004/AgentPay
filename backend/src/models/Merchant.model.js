import mongoose from "mongoose";

const { Schema } = mongoose;

const MerchantSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    verified: { type: Boolean, default: true },
    constitution: {
      maxDiscountPct: { type: Number, default: 15, min: 0, max: 100 },
      minMarginPaise: { type: Number, default: 10000 }, // money in paise
      maxAiTransactionPaise: { type: Number, default: 50000000 }, // ₹5,00,000
      refundApprovalThresholdPaise: { type: Number, default: 5000000 }, // ₹50,000
      priceChangeReapprovalPct: { type: Number, default: 5 },
      reservationMinutes: { type: Number, default: 15 },
      internationalEnabled: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

export default mongoose.models.Merchant || mongoose.model("Merchant", MerchantSchema);
