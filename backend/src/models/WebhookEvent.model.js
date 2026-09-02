import mongoose from "mongoose";

const WebhookEventSchema = new mongoose.Schema({}, { timestamps: true });
export default mongoose.models.WebhookEvent || mongoose.model("WebhookEvent", WebhookEventSchema);
