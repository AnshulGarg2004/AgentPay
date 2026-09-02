import { Router } from "express";
import {
  createMerchant,
  getMerchants,
  getMerchantById,
  getMerchantAnalytics,
  addMerchantProducts,
  getMerchantProducts,
} from "../controllers/merchant.controller.js";

const router = Router();

router.post("/", createMerchant);
router.get("/", getMerchants);
router.get("/:id", getMerchantById);
router.get("/:id/analytics", getMerchantAnalytics);
router.post("/:id/products", addMerchantProducts);
router.get("/:id/products", getMerchantProducts);

export default router;
