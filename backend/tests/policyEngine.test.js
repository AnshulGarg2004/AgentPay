import assert from "node:assert";
import test from "node:test";
import { evaluatePolicy } from "../src/services/policyEngine.service.js";

test("Policy Engine Unit Tests", async (t) => {
  await t.test("1. Under auto-approve threshold (Auto-approved)", () => {
    const result = evaluatePolicy({
      action: "purchase",
      amountInPaise: 5000000, // ₹50,000
      category: "chairs",
      merchantVerified: true,
      discountPct: 5,
      buyerConstitution: {
        maxTransactionPaise: 100000000, // ₹10 Lakhs
        humanApprovalThresholdPaise: 25000000, // ₹2.5 Lakhs
        allowedCategories: ["chairs", "monitors"],
        blockedCategories: ["weapons"],
        verifiedMerchantsOnly: true,
      },
      merchantConstitution: {
        maxDiscountPct: 15,
        maxAiTransactionPaise: 50000000, // ₹5 Lakhs
      },
    });

    assert.strictEqual(result.authorized, true);
    assert.strictEqual(result.requiresHumanApproval, false);
    assert.strictEqual(result.reasons.length, 0);
  });

  await t.test("2. Over max transaction limit (Hard Reject)", () => {
    const result = evaluatePolicy({
      action: "purchase",
      amountInPaise: 150000000, // ₹15 Lakhs
      category: "laptops",
      merchantVerified: true,
      buyerConstitution: {
        maxTransactionPaise: 100000000, // ₹10 Lakhs Limit
        humanApprovalThresholdPaise: 25000000,
      },
    });

    assert.strictEqual(result.authorized, false);
    assert.strictEqual(result.requiresHumanApproval, false);
    assert.ok(result.reasons.some((r) => r.includes("exceeds buyer max transaction limit")));
  });

  await t.test("3. Over human approval threshold (Requires Approval)", () => {
    const result = evaluatePolicy({
      action: "purchase",
      amountInPaise: 35000000, // ₹3.5 Lakhs (exceeds ₹2.5 Lakh threshold)
      category: "monitors",
      merchantVerified: true,
      buyerConstitution: {
        maxTransactionPaise: 100000000, // ₹10 Lakhs
        humanApprovalThresholdPaise: 25000000, // ₹2.5 Lakhs
      },
    });

    assert.strictEqual(result.authorized, true);
    assert.strictEqual(result.requiresHumanApproval, true);
    assert.ok(result.reasons.some((r) => r.includes("exceeds buyer human approval threshold")));
  });

  await t.test("4. Category not allowed / blocked (Hard Reject)", () => {
    const resultBlocked = evaluatePolicy({
      action: "purchase",
      amountInPaise: 1000000,
      category: "crypto",
      merchantVerified: true,
      buyerConstitution: {
        blockedCategories: ["crypto", "weapons"],
      },
    });

    assert.strictEqual(resultBlocked.authorized, false);
    assert.ok(resultBlocked.reasons.some((r) => r.includes("explicitly blocked")));

    const resultNotAllowed = evaluatePolicy({
      action: "purchase",
      amountInPaise: 1000000,
      category: "gaming",
      merchantVerified: true,
      buyerConstitution: {
        allowedCategories: ["chairs", "monitors"],
      },
    });

    assert.strictEqual(resultNotAllowed.authorized, false);
    assert.ok(resultNotAllowed.reasons.some((r) => r.includes("not in buyer's allowed categories list")));
  });

  await t.test("5. Merchant discount limit exceeded (Hard Reject)", () => {
    const result = evaluatePolicy({
      action: "discount",
      amountInPaise: 5000000,
      discountPct: 25, // Requested 25% discount
      merchantConstitution: {
        maxDiscountPct: 15, // Max 15% discount allowed by merchant
      },
    });

    assert.strictEqual(result.authorized, false);
    assert.ok(result.reasons.some((r) => r.includes("exceeds merchant maximum allowed discount limit")));
  });
});
