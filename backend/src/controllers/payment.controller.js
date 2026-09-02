import Transaction from "../models/Transaction.model.js";
import { createOrder } from "../services/razorpay.service.js";
import { acquireIdempotencyKey, completeIdempotencyKey } from "../services/idempotency.service.js";
import { transitionTransaction } from "../stateMachine/transitions.js";

// POST /api/orders
export async function createPaymentOrder(req, res, next) {
  try {
    const { transactionId } = req.body;
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

    // Emit socket event
    const io = req.app.get("io");
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
        console.log(`[Idempotency] Returning stored result for key '${key}'`);
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
      console.log(`[Demo] Simulating Payment Timeout for Transaction #${txn._id}`);

      // Lock state in PAYMENT_VERIFICATION
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

      const io = req.app.get("io");
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

    const io = req.app.get("io");
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
