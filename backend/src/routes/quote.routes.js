import { Router } from "express";
import { generateQuote, getQuote, acceptQuote } from "../controllers/quote.controller.js";

const router = Router();

router.post("/", generateQuote);
router.get("/:id", getQuote);
router.post("/:id/accept", acceptQuote);

export default router;
