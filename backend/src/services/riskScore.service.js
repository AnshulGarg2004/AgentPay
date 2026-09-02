/**
 * Deterministic Transaction Risk Scoring Service
 *
 * Input:
 * {
 *   amountInPaise: number,
 *   merchantVerified: boolean,
 *   discountPct?: number,
 *   policyResult?: { authorized: boolean, requiresHumanApproval: boolean, reasons: string[] },
 *   buyerHistory?: { previousDisputesCount?: number, accountAgeDays?: number }
 * }
 *
 * Output:
 * {
 *   riskLevel: "LOW" | "MEDIUM" | "HIGH",
 *   riskScore: number, // 0 to 100
 *   factors: string[]
 * }
 */
export function calculateRiskScore({
  amountInPaise = 0,
  merchantVerified = true,
  discountPct = 0,
  policyResult = { authorized: true, requiresHumanApproval: false, reasons: [] },
  buyerHistory = {},
}) {
  let score = 10; // Base score
  const factors = [];

  // 1. Amount Threshold Risk
  if (amountInPaise > 100000000) {
    // > ₹10 Lakhs
    score += 35;
    factors.push("High transaction volume (> ₹10,00,000)");
  } else if (amountInPaise > 25000000) {
    // > ₹2.5 Lakhs
    score += 20;
    factors.push("Significant transaction value (> ₹2,50,000)");
  }

  // 2. Merchant Verification Risk
  if (!merchantVerified) {
    score += 30;
    factors.push("Unverified merchant seller node");
  }

  // 3. Discount Volatility
  if (discountPct > 15) {
    score += 20;
    factors.push(`Aggressive discount applied (${discountPct}%)`);
  } else if (discountPct > 10) {
    score += 10;
    factors.push(`Moderate discount applied (${discountPct}%)`);
  }

  // 4. Policy Engine Human Approval Flag
  if (policyResult.requiresHumanApproval) {
    score += 25;
    factors.push("Policy Engine flagged human approval requirement");
  }

  // 5. Buyer History & Disputes Risk
  if (buyerHistory.previousDisputesCount && buyerHistory.previousDisputesCount > 0) {
    score += 40;
    factors.push(`Buyer org has ${buyerHistory.previousDisputesCount} prior dispute(s)`);
  }

  // Cap score between 0 and 100
  score = Math.min(100, Math.max(0, score));

  // Determine Level
  let riskLevel = "LOW";
  if (score >= 50) {
    riskLevel = "HIGH";
  } else if (score >= 25) {
    riskLevel = "MEDIUM";
  }

  return {
    riskLevel,
    riskScore: score,
    factors,
  };
}

export const riskScoreService = {
  calculateRiskScore,
};
