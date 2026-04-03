// ─────────────────────────────────────────────────────────────
// Express Type Augmentation
// ─────────────────────────────────────────────────────────────
// Extends the Express Request interface to include the decoded
// JWT payload so that downstream handlers have typed access to
// `req.user` without manual casting.
// ─────────────────────────────────────────────────────────────

declare global {
  namespace Express {
    interface Request {
      /** Populated by `auth.middleware` after JWT verification. */
      user?: {
        userId: string;
        role: "VIEWER" | "ANALYST" | "ADMIN";
      };
    }
  }
}

export {};
