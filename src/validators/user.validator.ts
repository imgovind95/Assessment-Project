// ─────────────────────────────────────────────────────────────
// User Management Validators (Zod)
// ─────────────────────────────────────────────────────────────

import { z } from "zod";

/** Valid roles — mirrors the Prisma Role enum. */
const RoleEnum = z.enum(["VIEWER", "ANALYST", "ADMIN"], {
  errorMap: () => ({ message: "Role must be VIEWER, ANALYST, or ADMIN" }),
});

/**
 * Schema for PATCH /api/users/:id/status
 */
export const updateStatusSchema = z.object({
  isActive: z.boolean({ required_error: "isActive (boolean) is required" }),
});

/**
 * Schema for PATCH /api/users/:id/role
 */
export const updateRoleSchema = z.object({
  role: RoleEnum,
});

/**
 * Schema for UUID path parameter validation.
 */
export const uuidParamSchema = z.object({
  id: z.string().uuid("Invalid user ID format"),
});

// ── Exported types ──────────────────────────────────────────
export type UpdateStatusInput = z.infer<typeof updateStatusSchema>;
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
