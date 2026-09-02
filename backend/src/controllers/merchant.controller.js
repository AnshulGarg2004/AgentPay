import Merchant from "../models/Merchant.model.js";
import Product from "../models/Product.model.js";
import Transaction from "../models/Transaction.model.js";

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

// GET /api/merchants/:id/analytics  (Real aggregate analytics & funnel)
export async function getMerchantAnalytics(req, res, next) {
  try {
    const { id } = req.params;
    const query = id && id !== "all" ? { merchantId: id } : {};

    const txns = await Transaction.find(query);

    const transactionCount = txns.length;
    let totalRevenuePaise = 0;
    let paidCount = 0;
    let pendingApprovalCount = 0;
    const stateBreakdown = {};

    // 1. Build 30-day date map for revenueByDay
    const dateRevenueMap = {};
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateKey = d.toISOString().split("T")[0]; // YYYY-MM-DD
      dateRevenueMap[dateKey] = 0;
    }

    txns.forEach((t) => {
      stateBreakdown[t.state] = (stateBreakdown[t.state] || 0) + 1;

      if (t.state === "PAID" || t.state === "COMPLETED") {
        paidCount++;
        const amt = t.amountInPaise || 0;
        totalRevenuePaise += amt;

        if (t.createdAt) {
          const dateKey = new Date(t.createdAt).toISOString().split("T")[0];
          if (dateRevenueMap[dateKey] !== undefined) {
            dateRevenueMap[dateKey] += amt;
          }
        }
      }

      if (t.state === "HUMAN_APPROVAL_REQUIRED") {
        pendingApprovalCount++;
      }
    });

    const conversionRate = transactionCount > 0 ? Number(((paidCount / transactionCount) * 100).toFixed(1)) : 0;
    const avgOrderValuePaise = paidCount > 0 ? Math.round(totalRevenuePaise / paidCount) : 0;

    // 2. Format revenueByDay
    const revenueByDay = Object.entries(dateRevenueMap).map(([date, revenueInPaise]) => ({
      date,
      revenueInPaise,
    }));

    // 3. Format conversionFunnel in logical funnel order
    const FUNNEL_ORDER = ["DISCOVERED", "QUOTED", "NEGOTIATING", "AGREED", "PAID", "COMPLETED"];
    const extraStates = Object.keys(stateBreakdown).filter((s) => !FUNNEL_ORDER.includes(s));
    const allFunnelStates = [...FUNNEL_ORDER, ...extraStates];

    const conversionFunnel = allFunnelStates.map((st) => ({
      state: st,
      count: stateBreakdown[st] || 0,
    }));

    return res.json({
      merchantId: id,
      totalRevenuePaise,
      totalRevenueInPaise: totalRevenuePaise,
      transactionCount,
      paidCount,
      conversionRate,
      avgOrderValuePaise,
      avgOrderValueInPaise: avgOrderValuePaise,
      pendingApprovalCount,
      stateBreakdown,
      revenueByDay,
      conversionFunnel,
    });
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
  getMerchantAnalytics,
  addMerchantProducts,
  getMerchantProducts,
};
