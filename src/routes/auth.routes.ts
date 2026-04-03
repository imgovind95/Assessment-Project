// ─────────────────────────────────────────────────────────────
// Auth Routes
// ─────────────────────────────────────────────────────────────
// Public routes — no authentication required.
// ─────────────────────────────────────────────────────────────

import { Router } from "express";
import * as authController from "../controllers/auth.controller";

const router = Router();

// POST /api/auth/register — Create a new user account
router.post("/register", authController.register);

// POST /api/auth/login — Authenticate and receive JWT
router.post("/login", authController.login);

export default router;
