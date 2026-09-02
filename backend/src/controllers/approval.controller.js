import Transaction from "../models/Transaction.model.js";
import AuditLog from "../models/AuditLog.model.js";
import { logAudit } from "../services/audit.service.js";
import { transitionTo } from "../services/transactionState.service.js";

// GET /api/approvals/pending
export async function getPendingApprovals(req, res, next) {
  try {
    const pendingTxns = await Transaction.find({ state: "HUMAN_APPROVAL_REQUIRED" })
      .populate("productId merchantId buyerId quoteId")
      .sort({ createdAt: -1 });

    return res.json(pendingTxns);
  } catch (err) {
    next(err);
  }
}

// GET /api/approvals/audit/:txnId
export async function getAuditLogs(req, res, next) {
  try {
    const { txnId } = req.params;
    let query = {};
    if (txnId && txnId !== "all") {
      query.transactionId = txnId;
    }
    const logs = await AuditLog.find(query).sort({ timestamp: -1 }).limit(100);
    return res.json(logs);
  } catch (err) {
    next(err);
  }
}

// POST /api/approvals/:txnId/approve
export async function approveTransaction(req, res, next) {
  try {
    const { txnId } = req.params;
    const { approvedBy } = req.body;
    const io = req.app.get("io");

    const txn = await Transaction.findById(txnId).populate("productId merchantId buyerId");
    if (!txn) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    if (txn.state !== "HUMAN_APPROVAL_REQUIRED") {
      return res.status(400).json({ error: `Transaction is in state '${txn.state}', cannot approve.` });
    }

    txn.approvedBy = approvedBy || "Human Operations Manager";
    txn.approvedAt = new Date();

    await transitionTo(txn, "PAYMENT_PENDING", {
      io,
      actor: "HUMAN",
      reason: `Flagged policy violation overridden and approved by ${txn.approvedBy}`,
    });

    return res.json({
      message: "Transaction approved successfully. Advanced to PAYMENT_PENDING.",
      transaction: txn,
    });
  } catch (err) {
    next(err);
  }
}

// POST /api/approvals/:txnId/reject
export async function rejectTransaction(req, res, next) {
  try {
    const { txnId } = req.params;
    const { rejectedBy, reason } = req.body;
    const io = req.app.get("io");

    const txn = await Transaction.findById(txnId).populate("productId merchantId buyerId");
    if (!txn) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    if (txn.state !== "HUMAN_APPROVAL_REQUIRED") {
      return res.status(400).json({ error: `Transaction is in state '${txn.state}', cannot reject.` });
    }

    txn.rejectedBy = rejectedBy || "Human Operations Manager";
    txn.rejectedAt = new Date();
    txn.rejectionReason = reason || "Rejected by human operations manager.";

    await transitionTo(txn, "POLICY_REJECTED", {
      io,
      actor: "HUMAN",
      reason: txn.rejectionReason,
    });

    return res.json({
      message: "Transaction rejected by human reviewer.",
      transaction: txn,
    });
  } catch (err) {
    next(err);
  }
}

export const approvalController = {
  getPendingApprovals,
  getAuditLogs,
  approveTransaction,
  rejectTransaction,
};
