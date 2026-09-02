import { Router } from "express";
import {
  getPendingApprovals,
  approveTransaction,
  rejectTransaction,
} from "../controllers/approval.controller.js";

const router = Router();

router.get("/pending", getPendingApprovals);
router.post("/:txnId/approve", approveTransaction);
router.post("/:txnId/reject", rejectTransaction);

export default router;
