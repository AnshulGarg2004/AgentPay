import { Router } from "express";
import {
  createPaymentOrder,
  initiatePayment,
  getPaymentStatus,
} from "../controllers/payment.controller.js";

const router = Router();

router.post("/orders", createPaymentOrder);
router.post("/initiate", initiatePayment);
router.get("/:txnId/status", getPaymentStatus);

export default router;
