import Product from "../models/Product.model.js";

// GET /api/products/search
export async function searchProducts(req, res, next) {
  try {
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

    const products = await Product.find(filter).populate("merchantId", "name verified constitution").sort({ priceInPaise: 1 });

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
