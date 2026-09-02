import Product from "../models/Product.model.js";
import Merchant from "../models/Merchant.model.js"; // Ensures Merchant model is registered for populate
import { getAvailableQuantity } from "./reservation.service.js";

/**
 * Pure data-access and calculation service for the Product catalog.
 * No AI calls, no HTTP handling.
 */

/**
 * Search products matching filters.
 * Always restricts to aiPurchasable: true.
 */
export async function searchProducts(filters = {}) {
  const { category, minPrice, maxPrice, minPriceInPaise, maxPriceInPaise, attributes, merchantId, query } = filters;

  const mongoFilter = { aiPurchasable: true };

  if (merchantId) {
    mongoFilter.merchantId = merchantId;
  }

  if (category && category !== "all") {
    mongoFilter["attributes.category"] = new RegExp(category, "i");
  }

  if (query) {
    mongoFilter.$or = [
      { name: new RegExp(query, "i") },
      { "attributes.category": new RegExp(query, "i") },
      { "attributes.description": new RegExp(query, "i") },
    ];
  }

  const effectiveMinPaise = minPriceInPaise || (minPrice ? Math.round(Number(minPrice) * 100) : null);
  const effectiveMaxPaise = maxPriceInPaise || (maxPrice ? Math.round(Number(maxPrice) * 100) : null);

  if (effectiveMinPaise || effectiveMaxPaise) {
    mongoFilter.priceInPaise = {};
    if (effectiveMinPaise) mongoFilter.priceInPaise.$gte = effectiveMinPaise;
    if (effectiveMaxPaise) mongoFilter.priceInPaise.$lte = effectiveMaxPaise;
  }

  if (attributes && typeof attributes === "object") {
    Object.entries(attributes).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== "") {
        mongoFilter[`attributes.${key}`] = typeof val === "string" ? new RegExp(val, "i") : val;
      }
    });
  }

  let products = await Product.find(mongoFilter)
    .populate("merchantId", "name verified constitution")
    .lean();

  // Fallback: If category specified returned 0, try fetching all aiPurchasable products for soft matching
  if (products.length === 0 && category && category !== "all") {
    products = await Product.find({ aiPurchasable: true })
      .populate("merchantId", "name verified constitution")
      .lean();
  }

  return products;
}

/**
 * Get product by ID. Throws clear error if not found.
 */
export async function getProductById(productId) {
  if (!productId) {
    throw new Error("Product ID is required");
  }

  const product = await Product.findById(productId).populate("merchantId", "name verified constitution");
  if (!product) {
    throw new Error(`Product not found for ID: ${productId}`);
  }

  return product;
}

/**
 * Calculate unit price in paise for a given quantity applying product bulk discounts.
 * Picks the best applicable discount tier where minQty <= quantity.
 */
export function calculatePriceForQuantity(product, quantity = 1) {
  if (!product) throw new Error("Product object is required for price calculation");

  const basePriceInPaise = product.priceInPaise;
  const qty = Number(quantity) || 1;
  const bulkDiscounts = product.bulkDiscounts || [];

  let maxDiscountPct = 0;

  for (const tier of bulkDiscounts) {
    if (qty >= tier.minQty && tier.discountPct > maxDiscountPct) {
      maxDiscountPct = tier.discountPct;
    }
  }

  if (maxDiscountPct <= 0) {
    return basePriceInPaise;
  }

  const discountedUnitPriceInPaise = Math.round(basePriceInPaise * (1 - maxDiscountPct / 100));

  // Ensure unit price never drops below minimum floor price if set
  if (product.minPriceInPaise && discountedUnitPriceInPaise < product.minPriceInPaise) {
    return product.minPriceInPaise;
  }

  return discountedUnitPriceInPaise;
}

/**
 * Check product stock availability for a requested quantity taking active reservations into account.
 */
export async function checkAvailability(productIdOrProduct, requestedQty = 1) {
  let productId;
  if (typeof productIdOrProduct === "object" && productIdOrProduct !== null) {
    productId = productIdOrProduct._id;
  } else {
    productId = productIdOrProduct;
  }

  const availableQty = await getAvailableQuantity(productId);
  const available = availableQty >= requestedQty;

  return {
    available,
    availableQty,
  };
}

export const catalogService = {
  searchProducts,
  getProductById,
  calculatePriceForQuantity,
  checkAvailability,
};
