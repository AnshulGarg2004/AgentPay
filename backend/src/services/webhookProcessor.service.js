import Transaction from "../models/Transaction.model.js";
import { transitionTo } from "./transactionState.service.js";
import { logAudit } from "./audit.service.js";

/**
 * Processes an already-verified, already-deduped Razorpay webhook event.
 * Safely handles transaction lookups and state transitions without crashing or throwing.
 */
export async function processWebhookEvent(event, meta = {}) {
  const eventType = event.event;
  const payload = event.payload || {};
  const io = meta.io;

  console.log(`[Webhook Processor] Processing event '${eventType}'...`);

  try {
    const paymentEntity = payload.payment?.entity || {};
    const orderEntity = payload.order?.entity || {};

    const razorpayOrderId = paymentEntity.order_id || orderEntity.id;
    const paymentId = paymentEntity.id;
    const errorDescription = paymentEntity.error_description || paymentEntity.error_reason || "Payment failed at Razorpay checkout.";

    if (eventType === "payment.captured" || eventType === "payment.authorized") {
      if (!razorpayOrderId) {
        console.error(`⚠️ [Webhook Processor] Missing razorpayOrderId in payload for event '${eventType}'`);
        return { status: "missing_order_id" };
      }

      const txn = await Transaction.findOne({
        $or: [
          { razorpayOrderId },
          { _id: paymentEntity.notes?.transactionId },
        ],
      });

      if (!txn) {
        console.error(`⚠️ [Webhook Processor] Transaction not found for Razorpay Order ID: '${razorpayOrderId}'`);
        return { status: "transaction_not_found", razorpayOrderId };
      }

      if (paymentId) {
        txn.razorpayPaymentId = paymentId;
        await txn.save();
      }

      // Transition transaction to PAID
      await transitionTo(txn._id, "PAID", {
        io,
        actor: "POLICY_ENGINE",
        reason: `Verified Razorpay payment.captured webhook for payment ID '${paymentId || txn.razorpayPaymentId}'. Escrow funds settled.`,
      });

      if (io) {
        io.emit("payment.event", {
          transactionId: txn._id,
          event: "payment.captured",
          razorpayPaymentId: paymentId || txn.razorpayPaymentId,
        });
      }

      return { status: "processed", eventType, transactionId: txn._id, state: "PAID" };
    }

    if (eventType === "payment.failed") {
      if (!razorpayOrderId) {
        console.error(`⚠️ [Webhook Processor] Missing razorpayOrderId in payload for 'payment.failed'`);
        return { status: "missing_order_id" };
      }

      const txn = await Transaction.findOne({
        $or: [
          { razorpayOrderId },
          { _id: paymentEntity.notes?.transactionId },
        ],
      });

      if (!txn) {
        console.error(`⚠️ [Webhook Processor] Transaction not found for Razorpay Order ID: '${razorpayOrderId}'`);
        return { status: "transaction_not_found", razorpayOrderId };
      }

      txn.paymentFailureReason = errorDescription;
      await txn.save();

      // Transition transaction to PAYMENT_FAILED
      await transitionTo(txn._id, "PAYMENT_FAILED", {
        io,
        actor: "POLICY_ENGINE",
        reason: `Razorpay payment.failed: ${errorDescription}`,
      });

      return { status: "processed", eventType, transactionId: txn._id, state: "PAYMENT_FAILED" };
    }

    if (eventType === "order.paid") {
      console.log(`ℹ️ [Webhook Processor] Received 'order.paid' for order '${razorpayOrderId}'. 'payment.captured' handles state transition.`);
      return { status: "logged_order_paid" };
    }

    console.log(`ℹ️ [Webhook Processor] Unrecognized event type: '${eventType}'. Ignored.`);
    return { status: "unrecognized_event_ignored", eventType };
  } catch (err) {
    console.error(`❌ [Webhook Processor Error] Processing failed for event '${eventType}':`, err.message);
    // Return gracefully without throwing so the HTTP webhook handler can return 200 OK to Razorpay
    return { status: "error_handled_gracefully", error: err.message };
  }
}

export const webhookProcessorService = {
  processWebhookEvent,
};
