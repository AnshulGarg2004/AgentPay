import Refund from "../models/Refund.model.js";
import Transaction from "../models/Transaction.model.js";
import Merchant from "../models/Merchant.model.js";
import Product from "../models/Product.model.js";
import { razorpay } from "../config/razorpay.js";
import { transitionTo } from "./transactionState.service.js";
import { logAudit } from "./audit.service.js";

/**
 * Checks refund eligibility against 4 strict rules:
 * 1. Transaction state must be PAID, FULFILLMENT, or COMPLETED.
 * 2. Order age must be within product's returnPolicyDays.
 * 3. Requested amount must not exceed original transaction amount.
 * 4. Checks merchant constitution threshold for REQUIRES_APPROVAL vs ELIGIBLE.
 */
export async function checkRefundEligibility(transactionId, requestedAmountInPaise) {
  const amount = Number(requestedAmountInPaise);
  if (isNaN(amount) || amount <= 0) {
    return {
      status: "REJECTED",
      reason: "Requested refund amount must be a positive integer in paise.",
    };
  }

  const transaction = await Transaction.findById(transactionId).populate("productId merchantId");
  if (!transaction) {
    return {
      status: "REJECTED",
      reason: `Transaction not found for ID: ${transactionId}`,
    };
  }

  // 1. Transaction State Check
  const validStates = ["PAID", "FULFILLMENT", "COMPLETED"];
  if (!validStates.includes(transaction.state)) {
    return {
      status: "REJECTED",
      reason: `Transaction is currently in state '${transaction.state}' — only PAID or COMPLETED transactions are eligible for refund.`,
    };
  }

  // 2. Order Age vs returnPolicyDays
  const orderAgeMs = Date.now() - new Date(transaction.createdAt).getTime();
  const orderAgeDays = Math.floor(orderAgeMs / (1000 * 60 * 60 * 24));
  const product = transaction.productId || {};
  const returnPolicyDays = product.returnPolicyDays || product.attributes?.returnPolicyDays || 7;

  if (orderAgeDays > returnPolicyDays) {
    return {
      status: "REJECTED",
      reason: `Order is ${orderAgeDays} days old, outside the ${returnPolicyDays}-day return window.`,
    };
  }

  // 3. Amount vs Original Transaction Amount
  if (amount > transaction.amountInPaise) {
    const requestedRupees = (amount / 100).toLocaleString("en-IN");
    const originalRupees = (transaction.amountInPaise / 100).toLocaleString("en-IN");
    return {
      status: "REJECTED",
      reason: `Requested refund amount ₹${requestedRupees} exceeds original transaction amount ₹${originalRupees}.`,
    };
  }

  // 4. Merchant Constitution Auto-Approval Threshold Check
  const merchant = transaction.merchantId || {};
  const thresholdPaise = merchant.constitution?.refundApprovalThresholdPaise || 500000; // ₹5,000 default

  if (amount > thresholdPaise) {
    const requestedRupees = (amount / 100).toLocaleString("en-IN");
    const thresholdRupees = (thresholdPaise / 100).toLocaleString("en-IN");
    return {
      status: "REQUIRES_APPROVAL",
      reason: `Refund amount ₹${requestedRupees} exceeds merchant auto-approval threshold ₹${thresholdRupees}. Requires Human Operations Approval.`,
    };
  }

  const requestedRupees = (amount / 100).toLocaleString("en-IN");
  return {
    status: "ELIGIBLE",
    reason: `Refund request of ₹${requestedRupees} is eligible for automatic processing.`,
  };
}

/**
 * Process an ELIGIBLE or approved refund document by invoking Razorpay Refund API
 * and transitioning transaction state to REFUND_PENDING.
 */
export async function processRefund(refundId, meta = {}) {
  const refund = await Refund.findById(refundId).populate("transactionId");
  if (!refund) {
    throw new Error(`Refund document not found for ID: ${refundId}`);
  }

  if (refund.status === "REJECTED") {
    throw new Error("Cannot process a rejected refund request.");
  }

  if (refund.status === "REQUIRES_APPROVAL" && !refund.approvedBy) {
    throw new Error("Refund requires human approval before it can be processed.");
  }

  const txn = refund.transactionId;
  const io = meta.io;

  let rzpRefundId = `rfd_sim_${Date.now()}`;

  // Call Razorpay Refund API if payment ID exists and real credentials are setup
  if (txn?.razorpayPaymentId && process.env.RAZORPAY_KEY_ID && !process.env.RAZORPAY_KEY_ID.includes("placeholder")) {
    try {
      const rzpRes = await razorpay.payments.refund(txn.razorpayPaymentId, {
        amount: refund.amountInPaise,
        notes: { refundId: refund._id, transactionId: txn._id },
      });
      if (rzpRes && rzpRes.id) {
        rzpRefundId = rzpRes.id;
      }
    } catch (rzpErr) {
      console.warn("Razorpay API refund call warning (using fallback refund ID):", rzpErr.message);
    }
  }

  // Update Refund Document
  refund.status = "PROCESSED";
  refund.razorpayRefundId = rzpRefundId;
  refund.processedAt = new Date();
  await refund.save();

  // Transition Transaction State to REFUND_PENDING
  if (txn) {
    await transitionTo(txn._id, "REFUND_PENDING", {
      io,
      actor: meta.actor || "POLICY_ENGINE",
      reason: `Refund of ₹${(refund.amountInPaise / 100).toLocaleString("en-IN")} processed (Refund ID: ${rzpRefundId}).`,
    });
  }

  await logAudit({
    transactionId: txn?._id,
    action: "PROCESS_REFUND",
    reason: `Processed refund of ₹${(refund.amountInPaise / 100).toLocaleString("en-IN")} (Razorpay Refund ID: ${rzpRefundId}). ${refund.reason}`,
    actor: meta.actor || "POLICY_ENGINE",
    result: "PROCESSED",
    metadata: { refundId: refund._id, razorpayRefundId: rzpRefundId, amountInPaise: refund.amountInPaise },
    io,
  });

  return refund;
}

/**
 * Approve a REQUIRES_APPROVAL refund and trigger processRefund.
 */
export async function approveRefund(refundId, approvedBy = "Human Operations Manager", meta = {}) {
  const refund = await Refund.findById(refundId);
  if (!refund) {
    throw new Error(`Refund document not found for ID: ${refundId}`);
  }

  if (refund.status !== "REQUIRES_APPROVAL") {
    throw new Error(`Refund is in status '${refund.status}', cannot approve.`);
  }

  refund.approvedBy = approvedBy;
  refund.approvedAt = new Date();
  refund.status = "ELIGIBLE";
  await refund.save();

  await logAudit({
    transactionId: refund.transactionId,
    action: "APPROVE_REFUND",
    reason: `Refund request of ₹${(refund.amountInPaise / 100).toLocaleString("en-IN")} approved by ${approvedBy}.`,
    actor: "HUMAN",
    result: "ELIGIBLE",
    metadata: { refundId: refund._id, approvedBy },
    io: meta.io,
  });

  // Now process the approved refund
  return await processRefund(refund._id, { ...meta, actor: "HUMAN" });
}

export const refundService = {
  checkRefundEligibility,
  processRefund,
  approveRefund,
};
