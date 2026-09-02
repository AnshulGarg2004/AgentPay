import {
  createNegotiation,
  addOfferToNegotiation,
  getNegotiationById,
} from "../services/negotiation.service.js";

// POST /api/negotiations
export async function startNegotiation(req, res, next) {
  try {
    const { productId, buyerId, quantity, targetPriceInPaise, requestedDeliveryDays, notes } = req.body;
    if (!productId) {
      return res.status(400).json({ error: "productId is required" });
    }

    const negotiation = await createNegotiation({
      productId,
      buyerId,
      quantity,
      targetPriceInPaise,
      requestedDeliveryDays,
      notes,
    });

    return res.status(201).json(negotiation);
  } catch (err) {
    next(err);
  }
}

// POST /api/negotiations/:id/offer
export async function submitOffer(req, res, next) {
  try {
    const { id } = req.params;
    const { sender, quantity, unitPriceInPaise, deliveryDays, notes } = req.body;

    if (!unitPriceInPaise) {
      return res.status(400).json({ error: "unitPriceInPaise is required for offer" });
    }

    const negotiation = await addOfferToNegotiation(id, {
      sender,
      quantity,
      unitPriceInPaise,
      deliveryDays,
      notes,
    });

    return res.json(negotiation);
  } catch (err) {
    next(err);
  }
}

// GET /api/negotiations/:id
export async function getNegotiation(req, res, next) {
  try {
    const negotiation = await getNegotiationById(req.params.id);
    if (!negotiation) {
      return res.status(404).json({ error: "Negotiation thread not found" });
    }
    return res.json(negotiation);
  } catch (err) {
    next(err);
  }
}

export const negotiationController = {
  startNegotiation,
  submitOffer,
  getNegotiation,
};
