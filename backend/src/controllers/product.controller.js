import Product from "../models/Product.model.js";
import { parseBuyerIntent } from "../services/ai/buyerIntentAgent.js";
import { searchAndRankCatalog } from "../services/ai/merchantAgent.js";

// GET /api/products/search OR POST /api/products/search
export async function searchProducts(req, res, next) {
  try {
    const promptText = req.query.q || req.query.prompt || req.body?.prompt || req.body?.q;

    // 1. Natural-Language Search Pipeline if prompt is provided
    if (promptText && typeof promptText === "string" && promptText.trim().length > 0) {
      const prompt = promptText.trim();

      // Step 1: Buyer Intent Agent parses natural language into validated structured intent
      const structuredIntent = await parseBuyerIntent(prompt);

      // Step 2: Merchant Agent searches real MongoDB collection and ranks results with DB explanations
      const rankedMatches = await searchAndRankCatalog(structuredIntent);

      return res.json({
        prompt,
        intent: structuredIntent,
        count: rankedMatches.length,
        matches: rankedMatches,
        // Legacy list format for simple array consumers
        products: rankedMatches.map((m) => ({
          ...m.product,
          matchExplanation: m.explanation,
          matchScore: m.score,
        })),
      });
    }

    // 2. Standard Filter Query Fallback
    const { query, category, minPrice, maxPrice, merchantId } = req.query;
    const filter = { aiPurchasable: true };

    if (merchantId) {
      filter.merchantId = merchantId;
    }

    if (category) {
      filter["attributes.category"] = new RegExp(category, "i");
    }

    if (query) {
      filter.$or = [
        { name: new RegExp(query, "i") },
        { "attributes.category": new RegExp(query, "i") },
        { "attributes.description": new RegExp(query, "i") },
      ];
    }

    if (minPrice || maxPrice) {
      filter.priceInPaise = {};
      if (minPrice) filter.priceInPaise.$gte = Math.round(Number(minPrice) * 100);
      if (maxPrice) filter.priceInPaise.$lte = Math.round(Number(maxPrice) * 100);
    }

    const products = await Product.find(filter)
      .populate("merchantId", "name verified constitution")
      .sort({ priceInPaise: 1 })
      .lean();

    return res.json(products);
  } catch (err) {
    next(err);
  }
}

// GET /api/products/:id
export async function getProductById(req, res, next) {
  try {
    const product = await Product.findById(req.params.id).populate("merchantId", "name verified constitution");
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }
    return res.json(product);
  } catch (err) {
    next(err);
  }
}

export const productController = {
  searchProducts,
  getProductById,
};
