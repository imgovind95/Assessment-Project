// ─────────────────────────────────────────────────────────────
// Financial Record Routes
// ─────────────────────────────────────────────────────────────
// Access control per requirement 5:
//   VIEWER  → GET (list, single)
//   ANALYST → VIEWER + POST (create)
//   ADMIN   → full access (create, update, delete)
// ─────────────────────────────────────────────────────────────

import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import { authorise } from "../middleware/role.middleware";
import * as recordController from "../controllers/record.controller";

const router = Router();

// All record routes require authentication
router.use(authenticate);

// ── Read endpoints (VIEWER, ANALYST, ADMIN) ─────────────────
router.get(
  "/",
  authorise("VIEWER", "ANALYST", "ADMIN"),
  recordController.listRecords
);

router.get(
  "/:id",
  authorise("VIEWER", "ANALYST", "ADMIN"),
  recordController.getRecord
);

// ── Create endpoint (ANALYST, ADMIN) ────────────────────────
router.post(
  "/",
  authorise("ANALYST", "ADMIN"),
  recordController.createRecord
);

// ── Update & Delete endpoints (ADMIN only) ──────────────────
router.put(
  "/:id",
  authorise("ADMIN"),
  recordController.updateRecord
);

router.delete(
  "/:id",
  authorise("ADMIN"),
  recordController.deleteRecord
);

export default router;
