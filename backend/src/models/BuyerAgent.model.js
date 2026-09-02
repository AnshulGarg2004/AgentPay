import mongoose from "mongoose";

const { Schema } = mongoose;

const BuyerAgentSchema = new Schema(
  {
    ownerOrg: { type: String, required: true, trim: true },
    constitution: {
      maxTransactionPaise: { type: Number, default: 100000000 }, // ₹10,00,000
      dailySpendLimitPaise: { type: Number, default: 500000000 }, // ₹50,00,000
      humanApprovalThresholdPaise: { type: Number, default: 25000000 }, // ₹2,50,000
      allowedCategories: { type: [String], default: [] },
      blockedCategories: { type: [String], default: [] },
      verifiedMerchantsOnly: { type: Boolean, default: true },
    },
  },
  { timestamps: true }
);

export default mongoose.models.BuyerAgent || mongoose.model("BuyerAgent", BuyerAgentSchema);
