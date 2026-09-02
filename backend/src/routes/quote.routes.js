import { Router } from "express";
import { generateQuote, getQuote } from "../controllers/quote.controller.js";

const router = Router();

router.post("/", generateQuote);
router.get("/:id", getQuote);

export default router;
