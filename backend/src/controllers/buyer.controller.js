import BuyerAgent from "../models/BuyerAgent.model.js";

// POST /api/buyers
export async function createBuyerAgent(req, res, next) {
  try {
    const { ownerOrg, constitution } = req.body;
    if (!ownerOrg) {
      return res.status(400).json({ error: "ownerOrg is required" });
    }

    const buyer = await BuyerAgent.create({
      ownerOrg,
      constitution: constitution || {},
    });

    return res.status(201).json(buyer);
  } catch (err) {
    next(err);
  }
}

// GET /api/buyers
export async function getBuyerAgents(req, res, next) {
  try {
    const buyers = await BuyerAgent.find().sort({ createdAt: -1 });
    return res.json(buyers);
  } catch (err) {
    next(err);
  }
}

// GET /api/buyers/:id
export async function getBuyerAgentById(req, res, next) {
  try {
    const buyer = await BuyerAgent.findById(req.params.id);
    if (!buyer) {
      return res.status(404).json({ error: "Buyer agent not found" });
    }
    return res.json(buyer);
  } catch (err) {
    next(err);
  }
}

export const buyerController = {
  createBuyerAgent,
  getBuyerAgents,
  getBuyerAgentById,
};
