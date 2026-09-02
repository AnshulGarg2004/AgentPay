import mongoose from "mongoose";

const TransactionSchema = new mongoose.Schema({}, { timestamps: true });
export default mongoose.models.Transaction || mongoose.model("Transaction", TransactionSchema);
