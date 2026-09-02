import mongoose from "mongoose";

const QuoteSchema = new mongoose.Schema({}, { timestamps: true });
export default mongoose.models.Quote || mongoose.model("Quote", QuoteSchema);
