import Quote from "../models/Quote.model.js";
import Product from "../models/Product.model.js";
import Merchant from "../models/Merchant.model.js";
import BuyerAgent from "../models/BuyerAgent.model.js";
import Transaction from "../models/Transaction.model.js";
import { createQuote, getQuoteById } from "../services/quote.service.js";
import { evaluatePolicy } from "../services/policyEngine.service.js";
import { calculateRiskScore } from "../services/riskScore.service.js";
import { logAudit } from "../services/audit.service.js";

// POST /api/quotes
export async function generateQuote(req, res, next) {
  try {
    const { productId, merchantId, buyerId, unitPriceInPaise, quantity, deliveryDays, expiresInMinutes, terms } = req.body;
    if (!productId) {
      return res.status(400).json({ error: "productId is required" });
    }

    const io = req.app.get("io");

    const quote = await createQuote({
      productId,
      merchantId,
      buyerId,
      unitPriceInPaise,
      quantity,
      deliveryDays,
      expiresInMinutes,
      terms,
    });

    await logAudit({
      action: "GENERATE_BINDING_QUOTE",
      reason: `Locked agreed pricing terms (₹${(quote.subtotalInPaise / 100).toLocaleString('en-IN')}) into binding quote with 15-minute expiration lock`,
      actor: "MERCHANT_AGENT",
      result: "QUOTE_ACTIVE",
      metadata: { quoteId: quote._id, expiresAt: quote.expiresAt },
      io,
    });

    return res.status(201).json(quote);
  } catch (err) {
    next(err);
  }
}

// GET /api/quotes/:id
export async function getQuote(req, res, next) {
  try {
    const quote = await getQuoteById(req.params.id);
    if (!quote) {
      return res.status(404).json({ error: "Quote not found" });
    }

    return res.json(quote);
  } catch (err) {
    next(err);
  }
}

// POST /api/quotes/:id/accept  (Triggers Policy Engine & Risk Scoring)
export async function acceptQuote(req, res, next) {
  try {
    const { id } = req.params;
    const quote = await getQuoteById(id);
    const io = req.app.get("io");

    if (!quote) {
      return res.status(404).json({ error: "Quote not found" });
    }

    if (quote.status === "EXPIRED" || new Date() > new Date(quote.expiresAt)) {
      quote.status = "EXPIRED";
      await quote.save();

      await logAudit({
        action: "ACCEPT_QUOTE_FAILED",
        reason: "Attempted to accept an expired quote. Price lock released.",
        actor: "BUYER_AGENT",
        result: "EXPIRED",
        io,
      });

      return res.status(400).json({ error: "Quote has expired. Cannot proceed to order creation." });
    }

    if (quote.status === "ACCEPTED") {
      return res.status(400).json({ error: "Quote has already been accepted." });
    }

    const product = await Product.findById(quote.productId);
    const merchant = await Merchant.findById(quote.merchantId);
    const buyerAgent = quote.buyerId ? await BuyerAgent.findById(quote.buyerId) : null;

    // Calculate discount percentage
    const discountPct = product.priceInPaise > 0
      ? Math.max(0, Math.round(((product.priceInPaise - quote.unitPriceInPaise) / product.priceInPaise) * 100))
      : 0;

    // 1. Evaluate Deterministic Policy Engine
    const policyResult = evaluatePolicy({
      action: "purchase",
      amountInPaise: quote.subtotalInPaise,
      category: product.attributes?.category || "",
      merchantVerified: merchant?.verified ?? true,
      discountPct,
      buyerConstitution: buyerAgent?.constitution || {},
      merchantConstitution: merchant?.constitution || {},
    });

    // 2. Calculate Deterministic Risk Score
    const riskResult = calculateRiskScore({
      amountInPaise: quote.subtotalInPaise,
      merchantVerified: merchant?.verified ?? true,
      discountPct,
      policyResult,
    });

    // Determine Transaction Initial State based on Policy Engine
    let txnState = "PAYMENT_PENDING";

    if (!policyResult.authorized) {
      txnState = "POLICY_REJECTED";
    } else if (policyResult.requiresHumanApproval || riskResult.riskLevel === "HIGH") {
      txnState = "HUMAN_APPROVAL_REQUIRED";
    }

    // Create Transaction Record
    const transaction = await Transaction.create({
      buyerId: buyerAgent?._id || null,
      merchantId: merchant._id,
      productId: product._id,
      quoteId: quote._id,
      amountInPaise: quote.subtotalInPaise,
      unitPriceInPaise: quote.unitPriceInPaise,
      quantity: quote.quantity,
      state: txnState,
      riskLevel: riskResult.riskLevel,
      riskScore: riskResult.riskScore,
      riskFactors: riskResult.factors,
      approvalRequired: policyResult.requiresHumanApproval || riskResult.riskLevel === "HIGH",
      approvalReasons: policyResult.reasons.length > 0 ? policyResult.reasons : riskResult.factors,
    });

    // Mark quote as ACCEPTED
    quote.status = "ACCEPTED";
    await quote.save();

    // AUDIT LOG FOR POLICY EVALUATION
    const policyReasonText = policyResult.reasons.length > 0
      ? policyResult.reasons.join(" | ")
      : `Transaction authorized within auto-approve threshold (Risk Score: ${riskResult.riskScore}/100)`;

    await logAudit({
      transactionId: transaction._id,
      action: "EVALUATE_POLICY_RULES",
      reason: policyReasonText,
      actor: "POLICY_ENGINE",
      result: txnState,
      metadata: { riskLevel: riskResult.riskLevel, riskScore: riskResult.riskScore },
      io,
    });

    // Emit live Socket.IO update
    if (io) {
      io.emit("policy.check", {
        transactionId: transaction._id,
        policyResult,
        riskResult,
      });
      io.emit("transaction.state_changed", {
        transactionId: transaction._id,
        state: txnState,
        approvalRequired: transaction.approvalRequired,
      });
    }

    if (!policyResult.authorized) {
      return res.status(422).json({
        error: "Transaction rejected by Policy Engine",
        policyResult,
        transaction,
      });
    }

    return res.status(201).json({
      message: txnState === "HUMAN_APPROVAL_REQUIRED"
        ? "Quote accepted. Transaction flagged for Human Operations Approval."
        : "Quote accepted successfully. Ready for payment settlement.",
      policyResult,
      riskResult,
      transaction,
    });
  } catch (err) {
    next(err);
  }
}

export const quoteController = {
  generateQuote,
  getQuote,
  acceptQuote,
};
