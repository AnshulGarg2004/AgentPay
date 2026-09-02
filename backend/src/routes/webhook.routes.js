import { Router } from "express";
import { handleRazorpayWebhook, simulateCapturedWebhook } from "../controllers/webhook.controller.js";

const router = Router();

router.post("/razorpay", handleRazorpayWebhook);
router.post("/simulate-captured", simulateCapturedWebhook);

export default router;
