// ─────────────────────────────────────────────────────────────
// Dashboard Routes
// ─────────────────────────────────────────────────────────────
// All authenticated users (VIEWER, ANALYST, ADMIN) can access
// these read-only aggregation endpoints.
// ─────────────────────────────────────────────────────────────

import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import { authorise } from "../middleware/role.middleware";
import * as dashboardController from "../controllers/dashboard.controller";

const router = Router();

// All dashboard routes require authentication + any role
router.use(authenticate);
router.use(authorise("VIEWER", "ANALYST", "ADMIN"));

// GET /api/dashboard/summary           — totalIncome, totalExpenses, netBalance
router.get("/summary", dashboardController.getSummary);

// GET /api/dashboard/category-breakdown — category-wise totals
router.get("/category-breakdown", dashboardController.getCategoryBreakdown);

// GET /api/dashboard/recent             — last 10 records
router.get("/recent", dashboardController.getRecentRecords);

// GET /api/dashboard/trends             — monthly aggregation (6 months)
router.get("/trends", dashboardController.getMonthlyTrends);

export default router;
