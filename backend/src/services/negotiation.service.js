import Negotiation from "../models/Negotiation.model.js";
import Product from "../models/Product.model.js";
import Merchant from "../models/Merchant.model.js";
import { generateMerchantNegotiationResponse } from "./ai/negotiationAgent.js";

export async function createNegotiation({ productId, buyerId, quantity, targetPriceInPaise, requestedDeliveryDays, notes }) {
  const product = await Product.findById(productId);
  if (!product) throw new Error("Product not found");

  const merchant = await Merchant.findById(product.merchantId);
  if (!merchant) throw new Error("Merchant not found");

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

  const merchantOffer = {
    sender: "MERCHANT_AGENT",
    action: merchantResponse.action,
    unitPriceInPaise: merchantResponse.unitPriceInPaise,
    quantity: merchantResponse.quantity,
    deliveryDays: merchantResponse.deliveryDays,
    reasoning: merchantResponse.reasoning,
  };

  let status = "OPEN";
  let agreedOffer = null;

  if (merchantResponse.action === "ACCEPT") {
    status = "AGREED";
    agreedOffer = {
      unitPriceInPaise: merchantResponse.unitPriceInPaise,
      quantity: merchantResponse.quantity,
      deliveryDays: merchantResponse.deliveryDays,
      subtotalInPaise: merchantResponse.unitPriceInPaise * merchantResponse.quantity,
    };
  } else if (merchantResponse.action === "REJECT") {
    status = "REJECTED";
  }

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

export async function addOfferToNegotiation(negotiationId, { sender, quantity, unitPriceInPaise, deliveryDays, notes }) {
  const negotiation = await Negotiation.findById(negotiationId);
  if (!negotiation) throw new Error("Negotiation thread not found");

  if (negotiation.status !== "OPEN") {
    throw new Error(`Negotiation is already ${negotiation.status}`);
  }

  const product = await Product.findById(negotiation.productId);
  const merchant = await Merchant.findById(negotiation.merchantId);

  const qty = Number(quantity || 1);
  const price = Number(unitPriceInPaise);
  const delivery = Number(deliveryDays || 3);

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

  const merchantOffer = {
    sender: "MERCHANT_AGENT",
    action: merchantResponse.action,
    unitPriceInPaise: merchantResponse.unitPriceInPaise,
    quantity: merchantResponse.quantity,
    deliveryDays: merchantResponse.deliveryDays,
    reasoning: merchantResponse.reasoning,
  };

  negotiation.offers.push(merchantOffer);

  if (merchantResponse.action === "ACCEPT") {
    negotiation.status = "AGREED";
    negotiation.agreedOffer = {
      unitPriceInPaise: merchantResponse.unitPriceInPaise,
      quantity: merchantResponse.quantity,
      deliveryDays: merchantResponse.deliveryDays,
      subtotalInPaise: merchantResponse.unitPriceInPaise * merchantResponse.quantity,
    };
  } else if (merchantResponse.action === "REJECT") {
    negotiation.status = "REJECTED";
  }

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
