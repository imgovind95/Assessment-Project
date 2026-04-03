// ─────────────────────────────────────────────────────────────
// Auth Validators (Zod)
// ─────────────────────────────────────────────────────────────

import { z } from "zod";

/** Valid roles — mirrors the Prisma Role enum. */
const RoleEnum = z.enum(["VIEWER", "ANALYST", "ADMIN"], {
  errorMap: () => ({ message: "Role must be VIEWER, ANALYST, or ADMIN" }),
});

/**
 * Schema for POST /api/auth/register
 * - name:     required, 2–100 chars
 * - email:    valid email format
 * - password: min 8 chars, at least one uppercase, one lowercase, one digit
 * - role:     one of VIEWER | ANALYST | ADMIN (defaults to VIEWER)
 */
export const registerSchema = z.object({
  name: z
    .string({ required_error: "Name is required" })
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be at most 100 characters")
    .trim(),

  email: z
    .string({ required_error: "Email is required" })
    .email("Invalid email format")
    .toLowerCase()
    .trim(),

  password: z
    .string({ required_error: "Password is required" })
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one digit"),

  role: RoleEnum.optional().default("VIEWER"),
});

/**
 * Schema for POST /api/auth/login
 */
export const loginSchema = z.object({
  email: z
    .string({ required_error: "Email is required" })
    .email("Invalid email format")
    .toLowerCase()
    .trim(),

  password: z
    .string({ required_error: "Password is required" })
    .min(1, "Password is required"),
});

// ── Exported types ──────────────────────────────────────────
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
