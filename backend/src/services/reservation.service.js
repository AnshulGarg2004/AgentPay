import mongoose from "mongoose";
import Reservation from "../models/Reservation.model.js";
import Product from "../models/Product.model.js";

/**
 * Get available stock for a product minus active (non-expired) reservations.
 */
export async function getAvailableQuantity(productId) {
  if (!productId) throw new Error("productId is required to check available quantity");

  const product = await Product.findById(productId);
  if (!product) throw new Error(`Product not found for ID: ${productId}`);

  const now = new Date();
  const objectId = typeof productId === "string" ? new mongoose.Types.ObjectId(productId) : productId;

  // Aggregate sum of currently active non-expired reservations
  const activeReservations = await Reservation.aggregate([
    {
      $match: {
        productId: objectId,
        expiresAt: { $gt: now },
      },
    },
    {
      $group: {
        _id: null,
        totalReserved: { $sum: "$quantity" },
      },
    },
  ]);

  const totalReserved = activeReservations.length > 0 ? activeReservations[0].totalReserved : 0;
  const availableQty = Math.max(0, (product.inventory || 0) - totalReserved);

  return availableQty;
}

/**
 * Reserve inventory for a product atomically for holdMinutes.
 * Throws a clear error if available quantity is less than requested quantity.
 */
export async function reserveInventory(productId, quantity, transactionId = null, holdMinutes = 15) {
  const reqQty = Number(quantity);
  if (isNaN(reqQty) || reqQty <= 0) {
    throw new Error("Quantity must be a positive number");
  }

  const availableQty = await getAvailableQuantity(productId);

  if (availableQty < reqQty) {
    throw new Error(
      `Insufficient available inventory to reserve requested quantity. Requested: ${reqQty}, Currently Available: ${availableQty}`
    );
  }

  const expiresAt = new Date(Date.now() + holdMinutes * 60 * 1000);

  const reservation = await Reservation.create({
    productId,
    quantity: reqQty,
    transactionId: transactionId || null,
    expiresAt,
  });

  return reservation;
}

/**
 * Delete a reservation early (e.g. on payment failure, order cancellation, or transaction completion).
 */
export async function releaseReservation(transactionId) {
  if (!transactionId) return { success: false, deletedCount: 0 };

  const result = await Reservation.deleteMany({ transactionId });

  return {
    success: true,
    deletedCount: result.deletedCount || 0,
  };
}

export const reservationService = {
  getAvailableQuantity,
  reserveInventory,
  releaseReservation,
};
