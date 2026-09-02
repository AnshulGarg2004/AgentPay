import WebhookEvent from "../models/WebhookEvent.model.js";
import Transaction from "../models/Transaction.model.js";
import { verifyWebhookSignature } from "../services/razorpay.service.js";
import { processWebhookEvent } from "../services/webhookProcessor.service.js";
import { transitionTo } from "../services/transactionState.service.js";
import { logAudit } from "../services/audit.service.js";

// POST /api/webhooks/razorpay
export async function handleRazorpayWebhook(req, res, next) {
  try {
    const signature = req.headers["x-razorpay-signature"];
    const rawBody = typeof req.body === "string" ? req.body : JSON.stringify(req.body);
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const io = req.app.get("io");

    // 1. Verify Razorpay webhook signature if secret is configured
    if (signature && process.env.RAZORPAY_WEBHOOK_SECRET) {
      const isValid = verifyWebhookSignature(rawBody, signature, process.env.RAZORPAY_WEBHOOK_SECRET);
      if (!isValid) {
        console.error("⚠️ Invalid Razorpay webhook signature header");
        return res.status(400).json({ error: "Invalid Razorpay webhook signature" });
      }
    }

    const eventId = body.event_id || body.payload?.payment?.entity?.id || `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const eventType = body.event || "unknown";

    // 2. Dedupe on WebhookEvent.eventId (insert-or-skip)
    try {
      await WebhookEvent.create({
        eventId,
        type: eventType,
        payload: body,
      });
    } catch (err) {
      if (err.code === 11000 || err.message?.includes("E11000")) {
        console.log(`ℹ️ Duplicate webhook event '${eventId}' received. Skipping duplicate processing.`);
        return res.status(200).json({ status: "ignored_duplicate", eventId });
      }
      // Log DB error but still return 200 to prevent Razorpay infinite retries
      console.error("WebhookEvent dedupe insert error:", err.message);
    }

    // 3. Process event via webhookProcessorService
    const result = await processWebhookEvent(body, { io });

    // Always return 200 OK to Razorpay
    return res.status(200).json({
      status: "received",
      eventId,
      result,
    });
  } catch (err) {
    console.error("Unhandled webhook controller error:", err.message);
    // Always return 200 OK to Razorpay to avoid infinite webhook retry loops
    return res.status(200).json({ status: "error_logged", error: err.message });
  }
}

// POST /api/webhooks/simulate-captured (Dev / Hero Demo Recovery Trigger)
export async function simulateCapturedWebhook(req, res, next) {
  try {
    const { transactionId } = req.body;
    const io = req.app.get("io");

    if (!transactionId) {
      return res.status(400).json({ error: "transactionId is required" });
    }

    const txn = await Transaction.findById(transactionId);
    if (!txn) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    txn.razorpayPaymentId = txn.razorpayPaymentId || `pay_simulated_${Date.now()}`;
    await txn.save();

    await transitionTo(txn._id, "PAID", {
      io,
      actor: "POLICY_ENGINE",
      reason: "Hero Demo Recovery: Verified simulated Razorpay webhook payment.captured event.",
    });

    if (io) {
      io.emit("payment.event", {
        transactionId: txn._id,
        event: "payment.captured",
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
