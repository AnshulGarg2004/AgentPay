import { Router } from "express";
import { startNegotiation, submitOffer, getNegotiation } from "../controllers/negotiation.controller.js";

const router = Router();

router.post("/", startNegotiation);
router.post("/:id/offer", submitOffer);
router.get("/:id", getNegotiation);

export default router;
