import AuditLog from "../models/AuditLog.model.js";

/**
 * Safely sanitizes metadata objects to remove circular references (e.g. Mongoose internals, Socket.IO instances)
 * before persisting to MongoDB BSON.
 */
function sanitizeMetadata(obj) {
  if (!obj || typeof obj !== "object") return obj || {};
  try {
    const seen = new WeakSet();
    const str = JSON.stringify(obj, (key, value) => {
      if (typeof value === "object" && value !== null) {
        if (seen.has(value)) {
          return undefined; // Drop circular reference
        }
        seen.add(value);
      }
      return value;
    });
    return JSON.parse(str || "{}");
  } catch (err) {
    return {};
  }
}

/**
 * Audit Trail Service (Build Plan Section 8 / Phase 6)
 * Creates immutable, granular audit logs for every AI decision & policy check.
 */
export async function logAudit({
  transactionId = null,
  action,
  reason,
  actor,
  result = "SUCCESS",
  metadata = {},
  io = null,
}) {
  try {
    const safeMetadata = sanitizeMetadata(metadata);

    const entry = await AuditLog.create({
      transactionId,
      action,
      reason,
      actor,
      result,
      metadata: safeMetadata,
      timestamp: new Date(),
    });

    // Emit live Socket.IO event if io instance is available
    if (io) {
      io.emit("agent.action", {
        _id: entry._id,
        transactionId,
        actor,
        action,
        reason,
        result,
        timestamp: entry.timestamp,
        metadata: safeMetadata,
      });
    }

    return entry;
  } catch (err) {
    console.error("Failed to write AuditLog entry:", err.message);
  }
}

export async function getAuditTrail(transactionId) {
  if (!transactionId) return [];
  return await AuditLog.find({ transactionId }).sort({ timestamp: 1 });
}

export const auditService = {
  logAudit,
  getAuditTrail,
};
