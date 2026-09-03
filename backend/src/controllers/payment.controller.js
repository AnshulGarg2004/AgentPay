import Transaction from "../models/Transaction.model.js";
import { createOrder, verifyPaymentSignature } from "../services/razorpay.service.js";
import { acquireIdempotencyKey, completeIdempotencyKey } from "../services/idempotency.service.js";
import { transitionTo } from "../services/transactionState.service.js";
import { logAudit } from "../services/audit.service.js";

// POST /api/payments/orders
export async function createPaymentOrder(req, res, next) {
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

    // Return existing razorpayOrderId if order was already created
    if (txn.razorpayOrderId) {
      return res.json({
        order: {
          id: txn.razorpayOrderId,
          amount: txn.amountInPaise,
          currency: "INR",
          key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_placeholder",
        },
        transaction: txn,
      });
    }

    const allowedOrderStates = ["PAYMENT_PENDING", "PAYMENT_PROCESSING", "RESERVED", "AGREED", "PAYMENT_FAILED"];
    if (!allowedOrderStates.includes(txn.state)) {
      return res.status(400).json({ error: `Transaction is in state '${txn.state}', expected PAYMENT_PENDING` });
    }

    // Create Razorpay Order
    const order = await createOrder({
      amountInPaise: txn.amountInPaise,
      receipt: `txn_${txn._id}`,
      notes: { transactionId: String(txn._id) },
    });

    txn.razorpayOrderId = order.id;

    // Transition state safely to PAYMENT_PROCESSING
    if (txn.state === "PAYMENT_PENDING" || txn.state === "RESERVED" || txn.state === "AGREED") {
      await transitionTo(txn._id, "PAYMENT_PROCESSING", {
        io,
        actor: "POLICY_ENGINE",
        reason: `Generated Razorpay Order ID '${order.id}' for ₹${(txn.amountInPaise / 100).toLocaleString('en-IN')}`,
      });
    } else {
      await txn.save();
    }

    return res.status(201).json({
      order,
      transaction: txn,
    });
  } catch (err) {
    next(err);
  }
}

// POST /api/payments/verify (Verifies payment signature from Razorpay Checkout frontend)
export async function verifyPayment(req, res, next) {
  try {
    const { transactionId, razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;
    const io = req.app.get("io");

    if (!transactionId || !razorpay_payment_id) {
      return res.status(400).json({ error: "transactionId and razorpay_payment_id are required" });
    }

    const txn = await Transaction.findById(transactionId);
    if (!txn) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    const isValid = verifyPaymentSignature({
      razorpay_order_id: razorpay_order_id || txn.razorpayOrderId,
      razorpay_payment_id,
      razorpay_signature,
    });

    if (!isValid) {
      await transitionTo(txn._id, "PAYMENT_FAILED", {
        io,
        actor: "POLICY_ENGINE",
        reason: "Razorpay payment signature verification failed at checkout.",
      });

      return res.status(400).json({
        success: false,
        error: "Invalid Razorpay payment signature",
      });
    }

    txn.razorpayPaymentId = razorpay_payment_id;
    if (razorpay_order_id) txn.razorpayOrderId = razorpay_order_id;
    await txn.save();

    const updatedTxn = await transitionTo(txn._id, "PAID", {
      io,
      actor: "POLICY_ENGINE",
      reason: `Verified Razorpay payment ID '${razorpay_payment_id}' via Razorpay Standard Checkout. Funds captured cleanly in escrow.`,
    });

    if (io) {
      io.emit("payment.event", {
        transactionId: txn._id,
        event: "payment.captured",
        razorpayPaymentId: razorpay_payment_id,
      });
    }

    return res.json({
      success: true,
      message: "Payment verified successfully!",
      transaction: updatedTxn,
    });
  } catch (err) {
    next(err);
  }
}

// POST /api/payments/failed (Reports checkout failure or cancellation)
export async function reportPaymentFailed(req, res, next) {
  try {
    const { transactionId, errorDescription, errorReason } = req.body;
    const io = req.app.get("io");

    if (!transactionId) {
      return res.status(400).json({ error: "transactionId is required" });
    }

    const txn = await Transaction.findById(transactionId);
    if (!txn) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    const failureReason = errorDescription || errorReason || "Payment declined or cancelled by buyer at checkout.";

    txn.paymentFailureReason = failureReason;
    await txn.save();

    const updatedTxn = await transitionTo(txn._id, "PAYMENT_FAILED", {
      io,
      actor: "POLICY_ENGINE",
      reason: `Razorpay checkout failure: ${failureReason}`,
    });

    return res.json({
      success: true,
      message: "Payment failure recorded.",
      transaction: updatedTxn,
    });
  } catch (err) {
    next(err);
  }
}

// POST /api/payments/initiate (Enforces Idempotency Engine)
export async function initiatePayment(req, res, next) {
  try {
    const { transactionId, idempotencyKey: bodyKey, simulateTimeout } = req.body;
    const headerKey = req.headers["x-idempotency-key"];
    const key = bodyKey || headerKey;
    const io = req.app.get("io");

    if (!key) {
      return res.status(400).json({ error: "idempotencyKey is required (in body or x-idempotency-key header)" });
    }

    if (!transactionId) {
      return res.status(400).json({ error: "transactionId is required" });
    }

    // 1. MUST go through Idempotency Service first
    const idempotency = await acquireIdempotencyKey(key, transactionId);

    if (!idempotency.acquired) {
      if (idempotency.isCompleted) {
        await logAudit({
          transactionId,
          action: "IDEMPOTENCY_DEDUPE_BLOCK",
          reason: `Duplicate payment initiation request blocked by idempotency key '${key}'. Returning cached response.`,
          actor: "POLICY_ENGINE",
          result: "CACHED_RESPONSE_RETURNED",
          metadata: { idempotencyKey: key },
          io,
        });

        return res.json({
          cached: true,
          ...idempotency.response,
        });
      }
      return res.status(409).json({ error: idempotency.message });
    }

    // 2. Fetch Transaction
    const txn = await Transaction.findById(transactionId);
    if (!txn) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    // 3. Hero Demo Moment: Payment Timeout Simulation (Scene 6)
    if (simulateTimeout) {
      if (txn.state === "PAYMENT_PENDING" || txn.state === "PAYMENT_PROCESSING") {
        await transitionTo(txn._id, "PAYMENT_VERIFICATION", {
          io,
          actor: "POLICY_ENGINE",
          reason: "Payment request timed out. EscrowAI protocol locked state in PAYMENT_VERIFICATION to prevent double-charging.",
        });
      }

      const timeoutResponse = {
        status: "TIMEOUT_WAITING_WEBHOOK",
        message: "Payment request timed out. EscrowAI protocol locked state in PAYMENT_VERIFICATION — awaiting Razorpay webhook confirmation without double-charging.",
        transactionId: txn._id,
        state: txn.state,
        idempotencyKey: key,
        simulatedTimeout: true,
      };

      await completeIdempotencyKey(key, timeoutResponse);

      return res.json(timeoutResponse);
    }

    // 4. Standard Payment Initiation Flow
    if (txn.state === "PAYMENT_PENDING" || txn.state === "PAYMENT_PROCESSING") {
      txn.razorpayPaymentId = `pay_demo_${Date.now()}`;
      await txn.save();

      await transitionTo(txn._id, "PAYMENT_VERIFICATION", {
        io,
        actor: "BUYER_AGENT",
        reason: `Initiated escrow payment with Razorpay payment ID '${txn.razorpayPaymentId}'`,
      });
    }

    const successResponse = {
      status: "PAYMENT_INITIATED",
      message: "Payment initiated successfully.",
      transactionId: txn._id,
      razorpayPaymentId: txn.razorpayPaymentId,
      state: txn.state,
      idempotencyKey: key,
    };

    await completeIdempotencyKey(key, successResponse);

    return res.json(successResponse);
  } catch (err) {
    next(err);
  }
}

// GET /api/payments/:txnId/status
export async function getPaymentStatus(req, res, next) {
  try {
    const txn = await Transaction.findById(req.params.txnId).populate("productId merchantId buyerId");
    if (!txn) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    return res.json({
      transactionId: txn._id,
      state: txn.state,
      amountInPaise: txn.amountInPaise,
      razorpayOrderId: txn.razorpayOrderId,
      razorpayPaymentId: txn.razorpayPaymentId,
      riskLevel: txn.riskLevel,
      transaction: txn,
    });
  } catch (err) {
    next(err);
  }
}

export const paymentController = {
  createPaymentOrder,
  verifyPayment,
  reportPaymentFailed,
  initiatePayment,
  getPaymentStatus,
};
