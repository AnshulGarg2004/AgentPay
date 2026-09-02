import Merchant from "../models/Merchant.model.js";
import Product from "../models/Product.model.js";

// POST /api/merchants
export async function createMerchant(req, res, next) {
  try {
    const { name, verified, constitution } = req.body;
    if (!name) {
      return res.status(400).json({ error: "Merchant name is required" });
    }

    const merchant = await Merchant.create({
      name,
      verified: verified !== undefined ? verified : true,
      constitution: constitution || {},
    });

    return res.status(201).json(merchant);
  } catch (err) {
    next(err);
  }
}

// GET /api/merchants
export async function getMerchants(req, res, next) {
  try {
    const merchants = await Merchant.find().sort({ createdAt: -1 });
    return res.json(merchants);
  } catch (err) {
    next(err);
  }
}

// GET /api/merchants/:id
export async function getMerchantById(req, res, next) {
  try {
    const merchant = await Merchant.findById(req.params.id);
    if (!merchant) {
      return res.status(404).json({ error: "Merchant not found" });
    }
    return res.json(merchant);
  } catch (err) {
    next(err);
  }
}

// POST /api/merchants/:id/products
export async function addMerchantProducts(req, res, next) {
  try {
    const { id } = req.params;
    const merchant = await Merchant.findById(id);
    if (!merchant) {
      return res.status(404).json({ error: "Merchant not found" });
    }

    const productsData = Array.isArray(req.body) ? req.body : req.body.products || [req.body];

    if (!productsData || productsData.length === 0) {
      return res.status(400).json({ error: "No products provided for import" });
    }

    const formattedProducts = productsData.map((p) => {
      const priceInPaise = p.priceInPaise !== undefined ? Number(p.priceInPaise) : Math.round((p.price || 0) * 100);
      const minPriceInPaise = p.minPriceInPaise !== undefined ? Number(p.minPriceInPaise) : Math.round((p.minPrice || p.price || 0) * 100);

      return {
        merchantId: id,
        name: p.name,
        priceInPaise,
        minPriceInPaise,
        inventory: Number(p.inventory || 0),
        attributes: p.attributes || {},
        bulkDiscounts: p.bulkDiscounts || [],
        deliveryMinDays: p.deliveryMinDays || 2,
        deliveryMaxDays: p.deliveryMaxDays || 7,
        warranty: p.warranty || "1 year standard",
        returnPolicyDays: p.returnPolicyDays || 7,
        aiPurchasable: p.aiPurchasable !== undefined ? p.aiPurchasable : true,
      };
    });

    const createdProducts = await Product.insertMany(formattedProducts);

    return res.status(201).json({
      message: `Successfully imported ${createdProducts.length} products`,
      count: createdProducts.length,
      products: createdProducts,
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/merchants/:id/products
export async function getMerchantProducts(req, res, next) {
  try {
    const products = await Product.find({ merchantId: req.params.id }).sort({ createdAt: -1 });
    return res.json(products);
  } catch (err) {
    next(err);
  }
}

export const merchantController = {
  createMerchant,
  getMerchants,
  getMerchantById,
  addMerchantProducts,
  getMerchantProducts,
};
