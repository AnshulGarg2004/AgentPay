import mongoose from "mongoose";

const IdempotencyKeySchema = new mongoose.Schema({}, { timestamps: true });
export default mongoose.models.IdempotencyKey || mongoose.model("IdempotencyKey", IdempotencyKeySchema);
