import { Router } from "express";
import { getTransactions, getTransactionById } from "../controllers/transaction.controller.js";

const router = Router();

router.get("/", getTransactions);
router.get("/:id", getTransactionById);

export default router;
