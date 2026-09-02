import { Router } from "express";
import {
  getPendingApprovals,
  getAuditLogs,
  approveTransaction,
  rejectTransaction,
} from "../controllers/approval.controller.js";

const router = Router();

router.get("/pending", getPendingApprovals);
router.get("/audit", getAuditLogs);
router.get("/audit/:txnId", getAuditLogs);
router.post("/:txnId/approve", approveTransaction);
router.post("/:txnId/reject", rejectTransaction);

export default router;
