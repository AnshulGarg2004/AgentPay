import { searchProducts, calculatePriceForQuantity } from "../catalog.service.js";

/**
 * Merchant Agent: Uses catalogService.searchProducts and calculatePriceForQuantity
 * to query real MongoDB products, rank matches according to buyer constraints,
 * and generate fact-based explanations strictly from database fields.
 */
export async function searchAndRankCatalog(structuredIntent) {
  const { category, quantity, maxUnitPriceInPaise, attributes, deliveryDeadline } = structuredIntent;

  // 1. Fetch Candidate Products via catalog.service.js (always aiPurchasable: true)
  const maxPriceFilter = maxUnitPriceInPaise && maxUnitPriceInPaise > 0
    ? Math.round(maxUnitPriceInPaise * 1.25)
    : null;

  const candidateProducts = await searchProducts({
    category,
    maxPriceInPaise: maxPriceFilter,
    attributes,
  });

  // 2. Rank Products & Compute Match Scores + Explanations
  const ranked = candidateProducts.map((p) => {
    let score = 100;
    const reasons = [];

    // Calculate effective unit price for requested quantity using bulk discounts
    const effectiveUnitPriceInPaise = calculatePriceForQuantity(p, quantity || 1);
    const unitPriceRupees = effectiveUnitPriceInPaise / 100;
    const maxPriceRupees = maxUnitPriceInPaise ? maxUnitPriceInPaise / 100 : null;

    // Price Evaluation
    if (maxUnitPriceInPaise && maxUnitPriceInPaise > 0) {
      if (effectiveUnitPriceInPaise <= maxUnitPriceInPaise) {
        score += 30;
        reasons.push(`costs ₹${unitPriceRupees.toLocaleString('en-IN')} per unit (after applicable bulk discounts) which is within your ₹${maxPriceRupees.toLocaleString('en-IN')} limit`);
      } else {
        score -= 25;
        reasons.push(`unit price ₹${unitPriceRupees.toLocaleString('en-IN')} is slightly above your target limit (floor price ₹${(p.minPriceInPaise / 100).toLocaleString('en-IN')})`);
      }
    } else {
      reasons.push(`priced at ₹${unitPriceRupees.toLocaleString('en-IN')} per unit`);
    }

    // Inventory Evaluation
    if (p.inventory >= quantity) {
      score += 20;
      reasons.push(`has ${p.inventory} units available in stock (covers your requirement of ${quantity})`);
    } else {
      score -= 30;
      reasons.push(`currently has ${p.inventory} units in stock (below your requested ${quantity})`);
    }

    // Delivery SLA Evaluation
    if (deliveryDeadline && deliveryDeadline > 0) {
      if (p.deliveryMinDays <= deliveryDeadline) {
        score += 20;
        reasons.push(`can be delivered in ${p.deliveryMinDays}-${p.deliveryMaxDays} days (within your ${deliveryDeadline}-day deadline)`);
      } else {
        score -= 15;
        reasons.push(`standard delivery SLA is ${p.deliveryMinDays}-${p.deliveryMaxDays} days (exceeds ${deliveryDeadline}-day deadline)`);
      }
    } else {
      reasons.push(`delivers in ${p.deliveryMinDays}-${p.deliveryMaxDays} days`);
    }

    // Attribute Matching (Color, Ergonomic, Specs)
    if (attributes) {
      const prodAttrs = p.attributes || {};

      if (attributes.color) {
        const prodColors = Array.isArray(prodAttrs.color)
          ? prodAttrs.color.map((c) => c.toLowerCase())
          : [String(prodAttrs.color || "").toLowerCase()];

        if (prodColors.some((c) => c.includes(attributes.color))) {
          score += 15;
          reasons.push(`available in requested ${attributes.color} color`);
        }
      }

      if (attributes.ergonomic) {
        if (prodAttrs.lumbarSupport || String(p.name).toLowerCase().includes("ergonomic") || prodAttrs.category === "chairs") {
          score += 10;
          reasons.push("features ergonomic design & lumbar support");
        }
      }

      if (attributes.ram && prodAttrs.ram) {
        if (String(prodAttrs.ram).toLowerCase().includes(attributes.ram)) {
          score += 15;
          reasons.push(`equipped with ${prodAttrs.ram} RAM`);
        }
      }
    }

    // Compose fact-based explanation string
    const matchExplanation = `Matches your requirement: ${reasons.join(", ")}.`;

    return {
      product: {
        ...p,
        effectiveUnitPriceInPaise,
      },
      score,
      explanation: matchExplanation,
      inStock: p.inventory >= quantity,
      withinBudget: maxUnitPriceInPaise ? effectiveUnitPriceInPaise <= maxUnitPriceInPaise : true,
    };
  });

  // Sort descending by match score
  ranked.sort((a, b) => b.score - a.score);

  return ranked;
}

export const merchantAgent = {
  searchAndRankCatalog,
};
