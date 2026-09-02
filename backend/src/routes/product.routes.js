import { Router } from "express";
import { searchProducts, getProductById } from "../controllers/product.controller.js";

const router = Router();

router.get("/search", searchProducts);
router.get("/:id", getProductById);

export default router;
