import IdempotencyKey from "../models/IdempotencyKey.model.js";

/**
 * Mongo Unique-Index Idempotency Service (Build Plan Section 9)
 * Guarantees zero double-charging without Redis or Docker.
 */
export async function acquireIdempotencyKey(key, transactionId = null) {
  if (!key) {
    throw new Error("idempotencyKey is required");
  }

  try {
    const newRecord = await IdempotencyKey.create({
      key,
      transactionId,
      status: "IN_PROGRESS",
    });

    return {
      acquired: true,
      record: newRecord,
    };
  } catch (err) {
    // Check if error is MongoDB Duplicate Key (E11000)
    if (err.code === 11000 || err.message?.includes("E11000")) {
      const existing = await IdempotencyKey.findOne({ key });
      if (!existing) {
        throw err;
      }

      if (existing.status === "COMPLETED") {
        return {
          acquired: false,
          isCompleted: true,
          response: existing.response,
        };
      }

      return {
        acquired: false,
        isCompleted: false,
        inProgress: true,
        message: "Operation is currently being processed by another concurrent request.",
      };
    }

    throw err;
  }
}

export async function completeIdempotencyKey(key, responseData) {
  return await IdempotencyKey.findOneAndUpdate(
    { key },
    {
      status: "COMPLETED",
      response: responseData,
    },
    { new: true }
  );
}

export const idempotencyService = {
  acquireIdempotencyKey,
  completeIdempotencyKey,
};
