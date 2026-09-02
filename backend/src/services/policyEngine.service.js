/**
 * Deterministic Policy Engine (Build Plan Section 8)
 * Pure JavaScript - ZERO LLM calls - No side effects.
 *
 * Input:
 * {
 *   action: "purchase" | "discount" | "refund",
 *   amountInPaise: number,
 *   category?: string,
 *   merchantVerified?: boolean,
 *   discountPct?: number,
 *   buyerConstitution?: object,
 *   merchantConstitution?: object
 * }
 *
 * Output:
 * {
 *   authorized: boolean,
 *   requiresHumanApproval: boolean,
 *   reasons: string[]
 * }
 */
export function evaluatePolicy({
  action = "purchase",
  amountInPaise = 0,
  category = "",
  merchantVerified = true,
  discountPct = 0,
  buyerConstitution = {},
  merchantConstitution = {},
}) {
  const reasons = [];
  let authorized = true;
  let requiresHumanApproval = false;

  const amountRupees = (amountInPaise / 100).toLocaleString("en-IN");

  // --- 1. BUYER CONSTITUTION CHECKS ---

  // 1a. Category Blocking Check
  if (category && buyerConstitution.blockedCategories?.length > 0) {
    const isBlocked = buyerConstitution.blockedCategories.some(
      (cat) => cat.toLowerCase() === category.toLowerCase()
    );
    if (isBlocked) {
      authorized = false;
      reasons.push(`Category '${category}' is explicitly blocked by buyer constitution.`);
    }
  }

  // 1b. Category Whitelist Check
  if (category && buyerConstitution.allowedCategories?.length > 0) {
    const isAllowed = buyerConstitution.allowedCategories.some(
      (cat) => cat.toLowerCase() === category.toLowerCase()
    );
    if (!isAllowed) {
      authorized = false;
      reasons.push(`Category '${category}' is not in buyer's allowed categories list.`);
    }
  }

  // 1c. Merchant Verification Check
  if (buyerConstitution.verifiedMerchantsOnly && !merchantVerified) {
    authorized = false;
    reasons.push("Merchant is unverified; buyer constitution requires verified merchants only.");
  }

  // 1d. Buyer Max Transaction Limit (Hard Stop)
  if (buyerConstitution.maxTransactionPaise && amountInPaise > buyerConstitution.maxTransactionPaise) {
    authorized = false;
    const maxTxRupees = (buyerConstitution.maxTransactionPaise / 100).toLocaleString("en-IN");
    reasons.push(`Transaction amount ₹${amountRupees} exceeds buyer max transaction limit ₹${maxTxRupees}.`);
  }

  // 1e. Buyer Human Approval Threshold
  if (buyerConstitution.humanApprovalThresholdPaise && amountInPaise > buyerConstitution.humanApprovalThresholdPaise) {
    requiresHumanApproval = true;
    const thresholdRupees = (buyerConstitution.humanApprovalThresholdPaise / 100).toLocaleString("en-IN");
    reasons.push(`Amount ₹${amountRupees} exceeds buyer human approval threshold ₹${thresholdRupees}.`);
  }

  // --- 2. MERCHANT CONSTITUTION CHECKS ---

  // 2a. Merchant Max Autonomous AI Transaction Limit
  if (merchantConstitution.maxAiTransactionPaise && amountInPaise > merchantConstitution.maxAiTransactionPaise) {
    requiresHumanApproval = true;
    const maxAiTxRupees = (merchantConstitution.maxAiTransactionPaise / 100).toLocaleString("en-IN");
    reasons.push(`Transaction amount ₹${amountRupees} exceeds merchant max autonomous AI limit ₹${maxAiTxRupees}.`);
  }

  // 2b. Merchant Max Discount Allowed Check
  if ((action === "discount" || discountPct > 0) && merchantConstitution.maxDiscountPct !== undefined) {
    if (discountPct > merchantConstitution.maxDiscountPct) {
      authorized = false;
      reasons.push(`Discount ${discountPct}% exceeds merchant maximum allowed discount limit ${merchantConstitution.maxDiscountPct}%.`);
    }
  }

  // 2c. Merchant Refund Approval Threshold
  if (action === "refund" && merchantConstitution.refundApprovalThresholdPaise) {
    if (amountInPaise > merchantConstitution.refundApprovalThresholdPaise) {
      requiresHumanApproval = true;
      const refundThresholdRupees = (merchantConstitution.refundApprovalThresholdPaise / 100).toLocaleString("en-IN");
      reasons.push(`Refund amount ₹${amountRupees} exceeds merchant refund human approval threshold ₹${refundThresholdRupees}.`);
    }
  }

  // Final Output Determination
  if (!authorized) {
    requiresHumanApproval = false; // Hard reject overrides human approval
  }

  return {
    authorized,
    requiresHumanApproval,
    reasons,
  };
}

export const policyEngineService = {
  evaluatePolicy,
};
