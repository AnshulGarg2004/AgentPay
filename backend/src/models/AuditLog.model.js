import mongoose from "mongoose";

const AuditLogSchema = new mongoose.Schema({}, { timestamps: true });
export default mongoose.models.AuditLog || mongoose.model("AuditLog", AuditLogSchema);
