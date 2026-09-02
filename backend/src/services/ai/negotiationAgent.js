import { groq, GROQ_MODEL } from "../../config/groq.js";

/**
 * Generate merchant-side negotiation response based on product pricing,
 * merchant constitution, and buyer's proposed terms.
 */
export async function generateMerchantNegotiationResponse({
  product,
  merchant,
  buyerOffer, // { unitPriceInPaise, quantity, deliveryDays, notes }
}) {
  const basePrice = product.priceInPaise;
  const floorPrice = product.minPriceInPaise || Math.round(basePrice * 0.85);
  const maxDiscountPct = merchant?.constitution?.maxDiscountPct || 15;
  const proposedPrice = buyerOffer.unitPriceInPaise;
  const proposedQty = buyerOffer.quantity || 1;
  const proposedDelivery = buyerOffer.deliveryDays || product.deliveryMinDays || 3;

  // 1. Check Groq AI if key is configured
  if (process.env.GROQ_API_KEY && process.env.GROQ_API_KEY !== "xxxxx") {
    try {
      const prompt = `
You are an autonomous Merchant Negotiation Agent representing "${merchant?.name || 'Merchant'}".
Product: "${product.name}"
Standard List Price: ₹${(basePrice / 100).toLocaleString('en-IN')} (${basePrice} paise)
Absolute Floor Price: ₹${(floorPrice / 100).toLocaleString('en-IN')} (${floorPrice} paise)
Max Discount Allowed: ${maxDiscountPct}%
Standard Delivery: ${product.deliveryMinDays || 2}-${product.deliveryMaxDays || 5} days

Buyer Counter-Offer:
- Offered Unit Price: ₹${(proposedPrice / 100).toLocaleString('en-IN')} (${proposedPrice} paise)
- Quantity: ${proposedQty}
- Requested Delivery SLA: ${proposedDelivery} days
- Buyer Note: "${buyerOffer.notes || 'None'}"

Rules for Decision:
1. If Offered Price >= Absolute Floor Price (₹${floorPrice / 100}): Output ACCEPT.
2. If Offered Price < Absolute Floor Price, but Quantity >= 10: Counter at ₹${floorPrice / 100} with bundled terms. Output COUNTER.
3. If Offered Price is dangerously low (< 70% of Floor Price): Output REJECT.
4. Otherwise: Output COUNTER with counter price at or above Absolute Floor Price.

Return strictly valid JSON only:
{
  "action": "ACCEPT" | "COUNTER" | "REJECT",
  "counterUnitPriceInPaise": number (integer in paise),
  "counterQuantity": number,
  "counterDeliveryDays": number,
  "reasoning": "Professional short explanation"
}
`;

      const completion = await groq.chat.completions.create({
        model: GROQ_MODEL,
        messages: [
          { role: "system", content: "You are a professional B2B commerce negotiation engine. Output valid JSON only." },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.2,
      });

      const parsed = JSON.parse(completion.choices[0].message.content);
      if (parsed.action && parsed.counterUnitPriceInPaise) {
        return {
          action: parsed.action,
          unitPriceInPaise: Math.max(parsed.counterUnitPriceInPaise, floorPrice),
          quantity: parsed.counterQuantity || proposedQty,
          deliveryDays: parsed.counterDeliveryDays || proposedDelivery,
          reasoning: parsed.reasoning || "Groq AI negotiation response",
        };
      }
    } catch (err) {
      console.warn("Groq AI negotiation call failed, using deterministic policy engine fallback:", err.message);
    }
  }

  // 2. Deterministic Rule Fallback (Always robust & reliable)
  if (proposedPrice >= basePrice) {
    return {
      action: "ACCEPT",
      unitPriceInPaise: proposedPrice,
      quantity: proposedQty,
      deliveryDays: proposedDelivery,
      reasoning: "Offered price meets or exceeds standard listing price. Terms accepted.",
    };
  }

  if (proposedPrice >= floorPrice) {
    return {
      action: "ACCEPT",
      unitPriceInPaise: proposedPrice,
      quantity: proposedQty,
      deliveryDays: proposedDelivery,
      reasoning: `Offered price of ₹${(proposedPrice / 100).toLocaleString('en-IN')} is within merchant policy limits (Floor: ₹${(floorPrice / 100).toLocaleString('en-IN')}).`,
    };
  }

  // If proposed price is below floor price
  const discountPctOffered = ((basePrice - proposedPrice) / basePrice) * 100;

  if (discountPctOffered > 35) {
    return {
      action: "REJECT",
      unitPriceInPaise: basePrice,
      quantity: proposedQty,
      deliveryDays: product.deliveryMinDays || 3,
      reasoning: `Requested price ₹${(proposedPrice / 100).toLocaleString('en-IN')} exceeds maximum allowed discount threshold (${maxDiscountPct}%). Offer rejected.`,
    };
  }

  // Bundled Counter-Offer (Counter at floor price or bundled delivery SLA)
  const bundledDelivery = Math.max(proposedDelivery, product.deliveryMaxDays || 5);
  return {
    action: "COUNTER",
    unitPriceInPaise: floorPrice,
    quantity: proposedQty,
    deliveryDays: bundledDelivery,
    reasoning: `Cannot meet ₹${(proposedPrice / 100).toLocaleString('en-IN')}. Counter-offering absolute floor price ₹${(floorPrice / 100).toLocaleString('en-IN')} with ${bundledDelivery}-day delivery SLA.`,
  };
}

export const negotiationAgent = {
  generateMerchantNegotiationResponse,
};
