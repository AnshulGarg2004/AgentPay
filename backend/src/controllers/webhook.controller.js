import WebhookEvent from "../models/WebhookEvent.model.js";
import Transaction from "../models/Transaction.model.js";
import { verifyWebhookSignature } from "../services/razorpay.service.js";
import { transitionTransaction } from "../stateMachine/transitions.js";

// POST /api/webhooks/razorpay
export async function handleRazorpayWebhook(req, res, next) {
  try {
    const signature = req.headers["x-razorpay-signature"];
    const rawBody = typeof req.body === "string" ? req.body : JSON.stringify(req.body);
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;

    // Optional signature verification check
    if (signature && process.env.RAZORPAY_WEBHOOK_SECRET) {
      const isValid = verifyWebhookSignature(rawBody, signature, process.env.RAZORPAY_WEBHOOK_SECRET);
      if (!isValid) {
        return res.status(400).json({ error: "Invalid Razorpay webhook signature" });
      }
    }

    const eventId = body.event_id || body.payload?.payment?.entity?.id || `evt_${Date.now()}`;
    const eventType = body.event || "payment.captured";
    const paymentEntity = body.payload?.payment?.entity || {};

    // 1. Dedupe webhook on unique eventId
    try {
      await WebhookEvent.create({
        eventId,
        type: eventType,
        payload: body,
      });
    } catch (err) {
      if (err.code === 11000 || err.message?.includes("E11000")) {
        console.log(`[Webhook] Deduplication: Ignoring duplicate webhook event '${eventId}'`);
        return res.status(200).json({ status: "ignored_duplicate", eventId });
      }
      throw err;
    }

    // 2. Process Event Types
    const orderId = paymentEntity.order_id;
    const txnId = paymentEntity.notes?.transactionId || body.transactionId;

    let txn = null;
    if (orderId) {
      txn = await Transaction.findOne({ razorpayOrderId: orderId });
    }
    if (!txn && txnId) {
      txn = await Transaction.findById(txnId);
    }

    if (!txn) {
      console.warn(`[Webhook] Transaction not found for order '${orderId}' or txnId '${txnId}'`);
      return res.status(200).json({ status: "transaction_not_found" });
    }

    const io = req.app.get("io");

    if (eventType === "payment.captured" || eventType === "payment.authorized") {
      txn.razorpayPaymentId = paymentEntity.id || txn.razorpayPaymentId || `pay_${Date.now()}`;

      // Transition to PAID
      if (txn.state !== "PAID") {
        transitionTransaction(txn, "PAID");
        await txn.save();
      }

      if (io) {
        io.emit("payment.event", {
          transactionId: txn._id,
          event: "payment.captured",
          razorpayPaymentId: txn.razorpayPaymentId,
        });
        io.emit("transaction.state_changed", {
          transactionId: txn._id,
          state: "PAID",
          razorpayPaymentId: txn.razorpayPaymentId,
        });
      }

      return res.json({ status: "processed", eventType, transactionState: txn.state });
    }

    if (eventType === "payment.failed") {
      if (txn.state !== "PAID") {
        transitionTransaction(txn, "PAYMENT_FAILED");
        await txn.save();
      }

      if (io) {
        io.emit("transaction.state_changed", {
          transactionId: txn._id,
          state: "PAYMENT_FAILED",
        });
      }

      return res.json({ status: "processed", eventType, transactionState: txn.state });
    }

    return res.json({ status: "received", eventType });
  } catch (err) {
    next(err);
  }
}

// POST /api/webhooks/simulate-captured  (Dev / Hero Demo Recovery Trigger)
export async function simulateCapturedWebhook(req, res, next) {
  try {
    const { transactionId } = req.body;
    if (!transactionId) {
      return res.status(400).json({ error: "transactionId is required" });
    }

    const txn = await Transaction.findById(transactionId);
    if (!txn) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    if (txn.state !== "PAID") {
      transitionTransaction(txn, "PAID");
      txn.razorpayPaymentId = txn.razorpayPaymentId || `pay_simulated_${Date.now()}`;
      await txn.save();
    }

    const io = req.app.get("io");
    if (io) {
      io.emit("payment.event", {
        transactionId: txn._id,
        event: "payment.captured",
        simulated: true,
      });
      io.emit("transaction.state_changed", {
        transactionId: txn._id,
        state: "PAID",
        simulated: true,
      });
    }

    return res.json({
      message: "Simulated Razorpay webhook 'payment.captured' processed successfully.",
      transaction: txn,
    });
  } catch (err) {
    next(err);
  }
}

export const webhookController = {
  handleRazorpayWebhook,
  simulateCapturedWebhook,
};
