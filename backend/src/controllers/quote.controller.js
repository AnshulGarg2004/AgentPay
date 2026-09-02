import { createQuote, getQuoteById } from "../services/quote.service.js";

// POST /api/quotes
export async function generateQuote(req, res, next) {
  try {
    const { productId, merchantId, buyerId, unitPriceInPaise, quantity, deliveryDays, expiresInMinutes, terms } = req.body;
    if (!productId) {
      return res.status(400).json({ error: "productId is required" });
    }

    const quote = await createQuote({
      productId,
      merchantId,
      buyerId,
      unitPriceInPaise,
      quantity,
      deliveryDays,
      expiresInMinutes,
      terms,
    });

    return res.status(201).json(quote);
  } catch (err) {
    next(err);
  }
}

// GET /api/quotes/:id
export async function getQuote(req, res, next) {
  try {
    const quote = await getQuoteById(req.params.id);
    if (!quote) {
      return res.status(404).json({ error: "Quote not found" });
    }

    return res.json(quote);
  } catch (err) {
    next(err);
  }
}

export const quoteController = {
  generateQuote,
  getQuote,
};
