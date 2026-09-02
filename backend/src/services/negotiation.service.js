import Negotiation from "../models/Negotiation.model.js";
import Product from "../models/Product.model.js";
import Merchant from "../models/Merchant.model.js";
import BuyerAgent from "../models/BuyerAgent.model.js";
import { generateMerchantNegotiationResponse } from "./ai/negotiationAgent.js";
import { evaluatePolicy } from "./policyEngine.service.js";
import { logAudit } from "./audit.service.js";

export async function createNegotiation({ productId, buyerId, quantity, targetPriceInPaise, requestedDeliveryDays, notes, io = null }) {
  const product = await Product.findById(productId);
  if (!product) throw new Error("Product not found");

  const merchant = await Merchant.findById(product.merchantId);
  if (!merchant) throw new Error("Merchant not found");

  const buyerAgent = buyerId ? await BuyerAgent.findById(buyerId) : null;

  const qty = Number(quantity || 1);
  const targetPrice = targetPriceInPaise ? Number(targetPriceInPaise) : product.priceInPaise;
  const deliveryDays = Number(requestedDeliveryDays || product.deliveryMinDays || 3);

  // 1. Record initial Buyer Offer
  const buyerOffer = {
    sender: "BUYER_AGENT",
    action: "OFFER",
    unitPriceInPaise: targetPrice,
    quantity: qty,
    deliveryDays: deliveryDays,
    reasoning: notes || `Initial offer for ${qty} unit(s) at ₹${(targetPrice / 100).toLocaleString('en-IN')}`,
  };

  await logAudit({
    action: "SUBMIT_INITIAL_OFFER",
    reason: buyerOffer.reasoning,
    actor: "BUYER_AGENT",
    result: "OFFER_SUBMITTED",
    metadata: { unitPriceInPaise: targetPrice, quantity: qty },
    io,
  });

  // 2. Generate Merchant Agent Response
  const merchantResponse = await generateMerchantNegotiationResponse({
    product,
    merchant,
    buyerOffer: {
      unitPriceInPaise: targetPrice,
      quantity: qty,
      deliveryDays,
      notes,
    },
  });

  const floorPrice = product.minPriceInPaise || Math.round((product.priceInPaise || 0) * 0.85);

  let merchantOffer = {
    sender: "MERCHANT_AGENT",
    action: merchantResponse.action,
    unitPriceInPaise: merchantResponse.unitPriceInPaise,
    quantity: merchantResponse.quantity,
    deliveryDays: merchantResponse.deliveryDays,
    reasoning: merchantResponse.reasoning,
  };

  let status = "OPEN";
  let agreedOffer = null;

  // 3. Policy Check ONLY when attempting to ACCEPT an offer
  if (merchantResponse.action === "ACCEPT") {
    const totalAmountPaise = targetPrice * qty;
    const listPricePaise = (product.priceInPaise || 0) * qty;
    const discountPct = listPricePaise > 0 ? Math.max(0, Math.round(((listPricePaise - totalAmountPaise) / listPricePaise) * 100)) : 0;

    const policyCheck = evaluatePolicy({
      action: "purchase",
      amountInPaise: totalAmountPaise,
      category: product.attributes?.category || "",
      merchantVerified: merchant?.verified ?? true,
      discountPct,
      buyerConstitution: buyerAgent?.constitution || {},
      merchantConstitution: merchant?.constitution || {},
    });

    if (!policyCheck.authorized) {
      // Cannot accept proposed discount/price due to policy limits. Convert ACCEPT to COUNTER at floor price!
      merchantOffer.action = "COUNTER";
      merchantOffer.unitPriceInPaise = floorPrice;
      merchantOffer.reasoning = `Merchant AI cannot accept proposed discount (${discountPct}%). Counter-offering policy-compliant floor price of ₹${(floorPrice / 100).toLocaleString('en-IN')}. (${policyCheck.reasons.join(" | ")})`;

      await logAudit({
        action: "POLICY_CONVERT_TO_COUNTER",
        reason: merchantOffer.reasoning,
        actor: "POLICY_ENGINE",
        result: "COUNTER_OFFERED",
        metadata: { counterPriceInPaise: floorPrice, policyReasons: policyCheck.reasons },
        io,
      });
    } else {
      status = "AGREED";
      agreedOffer = {
        unitPriceInPaise: merchantResponse.unitPriceInPaise,
        quantity: merchantResponse.quantity,
        deliveryDays: merchantResponse.deliveryDays,
        subtotalInPaise: merchantResponse.unitPriceInPaise * merchantResponse.quantity,
      };
    }
  } else if (merchantResponse.action === "REJECT") {
    status = "REJECTED";
  }

  await logAudit({
    action: `MERCHANT_${merchantOffer.action}`,
    reason: merchantOffer.reasoning,
    actor: "MERCHANT_AGENT",
    result: merchantOffer.action,
    metadata: { counterPriceInPaise: merchantOffer.unitPriceInPaise },
    io,
  });

  const negotiation = await Negotiation.create({
    productId,
    merchantId: merchant._id,
    buyerId: buyerId || null,
    status,
    agreedOffer,
    offers: [buyerOffer, merchantOffer],
  });

  return negotiation;
}

export async function addOfferToNegotiation(negotiationId, { sender, action, quantity, unitPriceInPaise, deliveryDays, notes, io = null }) {
  const negotiation = await Negotiation.findById(negotiationId);
  if (!negotiation) throw new Error("Negotiation thread not found");

  if (negotiation.status !== "OPEN") {
    throw new Error(`Negotiation is already ${negotiation.status}`);
  }

  const product = await Product.findById(negotiation.productId);
  const merchant = await Merchant.findById(negotiation.merchantId);
  const buyerAgent = negotiation.buyerId ? await BuyerAgent.findById(negotiation.buyerId) : null;

  const qty = Number(quantity || 1);
  const price = Number(unitPriceInPaise);
  const delivery = Number(deliveryDays || 3);

  // If Buyer explicitly ACCEPTS the merchant's counter-offer:
  if (action === "ACCEPT" || action === "ACCEPT_COUNTER") {
    const buyerAcceptOffer = {
      sender: sender || "BUYER_AGENT",
      action: "ACCEPT",
      unitPriceInPaise: price,
      quantity: qty,
      deliveryDays: delivery,
      reasoning: notes || `Accepted merchant counter offer of ₹${(price / 100).toLocaleString('en-IN')}`,
    };

    negotiation.offers.push(buyerAcceptOffer);
    negotiation.status = "AGREED";
    negotiation.agreedOffer = {
      unitPriceInPaise: price,
      quantity: qty,
      deliveryDays: delivery,
      subtotalInPaise: price * qty,
    };

    await logAudit({
      action: "ACCEPT_MERCHANT_OFFER",
      reason: buyerAcceptOffer.reasoning,
      actor: "BUYER_AGENT",
      result: "TERMS_AGREED",
      metadata: { unitPriceInPaise: price, quantity: qty },
      io,
    });

    await negotiation.save();
    return negotiation;
  }

  // Record Buyer counter-offer
  const newBuyerOffer = {
    sender: sender || "BUYER_AGENT",
    action: "COUNTER",
    unitPriceInPaise: price,
    quantity: qty,
    deliveryDays: delivery,
    reasoning: notes || `Counter offer for ${qty} unit(s) at ₹${(price / 100).toLocaleString('en-IN')}`,
  };

  negotiation.offers.push(newBuyerOffer);

  await logAudit({
    action: "SUBMIT_COUNTER_OFFER",
    reason: newBuyerOffer.reasoning,
    actor: "BUYER_AGENT",
    result: "COUNTER_SUBMITTED",
    metadata: { unitPriceInPaise: price, quantity: qty },
    io,
  });

  // Generate Merchant Response
  const merchantResponse = await generateMerchantNegotiationResponse({
    product,
    merchant,
    buyerOffer: {
      unitPriceInPaise: price,
      quantity: qty,
      deliveryDays: delivery,
      notes,
    },
  });

  const floorPrice = product.minPriceInPaise || Math.round((product.priceInPaise || 0) * 0.85);

  let merchantOffer = {
    sender: "MERCHANT_AGENT",
    action: merchantResponse.action,
    unitPriceInPaise: merchantResponse.unitPriceInPaise,
    quantity: merchantResponse.quantity,
    deliveryDays: merchantResponse.deliveryDays,
    reasoning: merchantResponse.reasoning,
  };

  if (merchantResponse.action === "ACCEPT") {
    const totalAmountPaise = price * qty;
    const listPricePaise = (product.priceInPaise || 0) * qty;
    const discountPct = listPricePaise > 0 ? Math.max(0, Math.round(((listPricePaise - totalAmountPaise) / listPricePaise) * 100)) : 0;

    const policyCheck = evaluatePolicy({
      action: "purchase",
      amountInPaise: totalAmountPaise,
      category: product.attributes?.category || "",
      merchantVerified: merchant?.verified ?? true,
      discountPct,
      buyerConstitution: buyerAgent?.constitution || {},
      merchantConstitution: merchant?.constitution || {},
    });

    if (!policyCheck.authorized) {
      // Cannot accept proposed discount/price due to policy limits. Convert ACCEPT to COUNTER at floor price!
      merchantOffer.action = "COUNTER";
      merchantOffer.unitPriceInPaise = floorPrice;
      merchantOffer.reasoning = `Merchant AI cannot accept proposed discount (${discountPct}%). Counter-offering policy-compliant floor price of ₹${(floorPrice / 100).toLocaleString('en-IN')}. (${policyCheck.reasons.join(" | ")})`;

      await logAudit({
        action: "POLICY_CONVERT_TO_COUNTER",
        reason: merchantOffer.reasoning,
        actor: "POLICY_ENGINE",
        result: "COUNTER_OFFERED",
        metadata: { counterPriceInPaise: floorPrice, policyReasons: policyCheck.reasons },
        io,
      });
    } else {
      negotiation.status = "AGREED";
      negotiation.agreedOffer = {
        unitPriceInPaise: merchantResponse.unitPriceInPaise,
        quantity: merchantResponse.quantity,
        deliveryDays: merchantResponse.deliveryDays,
        subtotalInPaise: merchantResponse.unitPriceInPaise * merchantResponse.quantity,
      };
    }
  } else if (merchantResponse.action === "REJECT") {
    negotiation.status = "REJECTED";
  }

  negotiation.offers.push(merchantOffer);

  await logAudit({
    action: `MERCHANT_${merchantOffer.action}`,
    reason: merchantOffer.reasoning,
    actor: "MERCHANT_AGENT",
    result: merchantOffer.action,
    metadata: { counterPriceInPaise: merchantOffer.unitPriceInPaise },
    io,
  });

  await negotiation.save();
  return negotiation;
}

export async function getNegotiationById(id) {
  return await Negotiation.findById(id).populate("productId merchantId buyerId");
}

export const negotiationService = {
  createNegotiation,
  addOfferToNegotiation,
  getNegotiationById,
};
