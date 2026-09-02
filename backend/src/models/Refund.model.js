import mongoose from "mongoose";

const RefundSchema = new mongoose.Schema({}, { timestamps: true });
export default mongoose.models.Refund || mongoose.model("Refund", RefundSchema);
