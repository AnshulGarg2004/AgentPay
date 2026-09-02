import { Router } from "express";
import {
  createPaymentOrder,
  verifyPayment,
  reportPaymentFailed,
  initiatePayment,
  getPaymentStatus,
} from "../controllers/payment.controller.js";

const router = Router();

router.post("/orders", createPaymentOrder);
router.post("/verify", verifyPayment);
router.post("/failed", reportPaymentFailed);
router.post("/initiate", initiatePayment);
router.get("/:txnId/status", getPaymentStatus);

export default router;
