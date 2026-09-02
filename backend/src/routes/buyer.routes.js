import { Router } from "express";
import { createBuyerAgent, getBuyerAgents, getBuyerAgentById } from "../controllers/buyer.controller.js";

const router = Router();

router.post("/", createBuyerAgent);
router.get("/", getBuyerAgents);
router.get("/:id", getBuyerAgentById);

export default router;
