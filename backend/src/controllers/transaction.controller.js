import Transaction from "../models/Transaction.model.js";

// GET /api/transactions
export async function getTransactions(req, res, next) {
  try {
    const { merchantId, buyerId, state, search, limit = 50 } = req.query;

    const query = {};

    if (merchantId && merchantId !== "all") {
      query.merchantId = merchantId;
    }
    if (buyerId && buyerId !== "all") {
      query.buyerId = buyerId;
    }
    if (state && state !== "ALL") {
      query.state = state;
    }

    let txns = await Transaction.find(query)
      .populate("productId merchantId buyerId quoteId")
      .sort({ createdAt: -1 })
      .limit(Number(limit));

    // Optional text search filter on populated fields or ID
    if (search) {
      const term = search.toLowerCase();
      txns = txns.filter((t) => {
        const idMatch = String(t._id).toLowerCase().includes(term);
        const prodMatch = t.productId?.name?.toLowerCase().includes(term);
        const merchantMatch = t.merchantId?.name?.toLowerCase().includes(term);
        const stateMatch = t.state?.toLowerCase().includes(term);
        return idMatch || prodMatch || merchantMatch || stateMatch;
      });
    }

    return res.json(txns);
  } catch (err) {
    next(err);
  }
}

// GET /api/transactions/:id
export async function getTransactionById(req, res, next) {
  try {
    const txn = await Transaction.findById(req.params.id).populate("productId merchantId buyerId quoteId");
    if (!txn) {
      return res.status(404).json({ error: "Transaction not found" });
    }
    return res.json(txn);
  } catch (err) {
    next(err);
  }
}

export const transactionController = {
  getTransactions,
  getTransactionById,
};
