import Quote from "../models/Quote.model.js";
import Product from "../models/Product.model.js";

export async function createQuote({ productId, merchantId, buyerId, unitPriceInPaise, quantity, deliveryDays, expiresInMinutes = 15, terms }) {
  const product = await Product.findById(productId);
  if (!product) throw new Error("Product not found");

  const qty = Number(quantity || 1);
  const unitPrice = Number(unitPriceInPaise || product.priceInPaise);
  const subtotal = unitPrice * qty;

  const now = new Date();
  const expiresAt = new Date(now.getTime() + expiresInMinutes * 60 * 1000);

  const quote = await Quote.create({
    productId,
    merchantId: merchantId || product.merchantId,
    buyerId: buyerId || null,
    unitPriceInPaise: unitPrice,
    quantity: qty,
    subtotalInPaise: subtotal,
    deliveryDays: Number(deliveryDays || product.deliveryMinDays || 3),
    terms: terms || { warranty: product.warranty, returnPolicyDays: product.returnPolicyDays },
    status: "ACTIVE",
    expiresAt,
  });

  return quote;
}

export async function getQuoteById(id) {
  const quote = await Quote.findById(id).populate("productId merchantId buyerId");
  if (!quote) return null;

  // Check Expiry Logic
  const now = new Date();
  if (quote.status === "ACTIVE" && now > new Date(quote.expiresAt)) {
    quote.status = "EXPIRED";
    await quote.save();
  }

  return quote;
}

export const quoteService = {
  createQuote,
  getQuoteById,
};
