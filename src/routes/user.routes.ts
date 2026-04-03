// ─────────────────────────────────────────────────────────────
// User Management Routes (ADMIN only)
// ─────────────────────────────────────────────────────────────

import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import { authorise } from "../middleware/role.middleware";
import * as userController from "../controllers/user.controller";

const router = Router();

// All user-management routes require authentication + ADMIN role
router.use(authenticate);
router.use(authorise("ADMIN"));

// GET    /api/users            — List all users
router.get("/", userController.getAllUsers);

// PATCH  /api/users/:id/status — Toggle active/inactive
router.patch("/:id/status", userController.updateStatus);

// PATCH  /api/users/:id/role   — Change user role
router.patch("/:id/role", userController.updateRole);

export default router;
