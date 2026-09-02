import Transaction from "../models/Transaction.model.js";
import { createOrder } from "../services/razorpay.service.js";
import { acquireIdempotencyKey, completeIdempotencyKey } from "../services/idempotency.service.js";
import { transitionTransaction } from "../stateMachine/transitions.js";
import { logAudit } from "../services/audit.service.js";

// POST /api/orders
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

    if (txn.state !== "PAYMENT_PENDING") {
      return res.status(400).json({ error: `Transaction is in state '${txn.state}', expected PAYMENT_PENDING` });
    }

    // Create Razorpay Order
    const order = await createOrder({
      amountInPaise: txn.amountInPaise,
      receipt: `txn_${txn._id}`,
      notes: { transactionId: String(txn._id) },
    });

    txn.razorpayOrderId = order.id;
    transitionTransaction(txn, "PAYMENT_PROCESSING");
    await txn.save();

    await logAudit({
      transactionId: txn._id,
      action: "CREATE_RAZORPAY_ORDER",
      reason: `Generated Razorpay Order ID '${order.id}' for ₹${(txn.amountInPaise / 100).toLocaleString('en-IN')}`,
      actor: "POLICY_ENGINE",
      result: "PAYMENT_PROCESSING",
      metadata: { razorpayOrderId: order.id },
      io,
    });

    if (io) {
      io.emit("transaction.state_changed", {
        transactionId: txn._id,
        state: txn.state,
        razorpayOrderId: order.id,
      });
    }

    return res.status(201).json({
      order,
      transaction: txn,
    });
  } catch (err) {
    next(err);
  }
}

// POST /api/payments/initiate  (Enforces Idempotency Engine)
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
        transitionTransaction(txn, "PAYMENT_VERIFICATION");
        await txn.save();
      }

      const timeoutResponse = {
        status: "TIMEOUT_WAITING_WEBHOOK",
        message: "Payment request timed out. AgentPay protocol locked state in PAYMENT_VERIFICATION — awaiting Razorpay webhook confirmation without double-charging.",
        transactionId: txn._id,
        state: txn.state,
        idempotencyKey: key,
        simulatedTimeout: true,
      };

      await completeIdempotencyKey(key, timeoutResponse);

      await logAudit({
        transactionId: txn._id,
        action: "PAYMENT_TIMEOUT_SIMULATED",
        reason: "Hero Demo Scene 6: Payment gateway response timed out. AgentPay protocol locked state in PAYMENT_VERIFICATION to prevent double-charging.",
        actor: "POLICY_ENGINE",
        result: "PAYMENT_VERIFICATION",
        metadata: { idempotencyKey: key },
        io,
      });

      if (io) {
        io.emit("transaction.state_changed", {
          transactionId: txn._id,
          state: txn.state,
          simulatedTimeout: true,
        });
      }

      return res.json(timeoutResponse);
    }

    // 4. Standard Payment Initiation Flow
    if (txn.state === "PAYMENT_PENDING" || txn.state === "PAYMENT_PROCESSING") {
      transitionTransaction(txn, "PAYMENT_VERIFICATION");
      txn.razorpayPaymentId = `pay_demo_${Date.now()}`;
      await txn.save();
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

    await logAudit({
      transactionId: txn._id,
      action: "INITIATE_PAYMENT_SUCCESS",
      reason: `Initiated escrow payment with Razorpay payment ID '${txn.razorpayPaymentId}'`,
      actor: "BUYER_AGENT",
      result: "PAYMENT_VERIFICATION",
      metadata: { razorpayPaymentId: txn.razorpayPaymentId, idempotencyKey: key },
      io,
    });

    if (io) {
      io.emit("transaction.state_changed", {
        transactionId: txn._id,
        state: txn.state,
        razorpayPaymentId: txn.razorpayPaymentId,
      });
    }

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
  initiatePayment,
  getPaymentStatus,
};
