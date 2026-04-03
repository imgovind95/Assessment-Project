// ─────────────────────────────────────────────────────────────
// Financial Record Validators (Zod)
// ─────────────────────────────────────────────────────────────

import { z } from "zod";

/** Valid record types — mirrors the Prisma RecordType enum. */
const RecordTypeEnum = z.enum(["INCOME", "EXPENSE"], {
  errorMap: () => ({ message: "Type must be INCOME or EXPENSE" }),
});

/**
 * Schema for POST /api/records (create a financial record).
 */
export const createRecordSchema = z.object({
  amount: z
    .number({ required_error: "Amount is required", invalid_type_error: "Amount must be a number" })
    .positive("Amount must be a positive number"),

  type: RecordTypeEnum,

  category: z
    .string({ required_error: "Category is required" })
    .min(1, "Category cannot be empty")
    .max(100, "Category must be at most 100 characters")
    .trim(),

  date: z
    .string({ required_error: "Date is required" })
    .datetime({ message: "Date must be a valid ISO 8601 datetime string" }),

  notes: z
    .string()
    .max(500, "Notes must be at most 500 characters")
    .trim()
    .optional(),
});

/**
 * Schema for PUT /api/records/:id (update a financial record).
 * All fields are optional so callers can do partial updates.
 */
export const updateRecordSchema = z.object({
  amount: z
    .number({ invalid_type_error: "Amount must be a number" })
    .positive("Amount must be a positive number")
    .optional(),

  type: RecordTypeEnum.optional(),

  category: z
    .string()
    .min(1, "Category cannot be empty")
    .max(100, "Category must be at most 100 characters")
    .trim()
    .optional(),

  date: z
    .string()
    .datetime({ message: "Date must be a valid ISO 8601 datetime string" })
    .optional(),

  notes: z
    .string()
    .max(500, "Notes must be at most 500 characters")
    .trim()
    .optional()
    .nullable(),
});

/**
 * Schema for GET /api/records query parameters.
 * All filters are optional. `page` and `limit` default to 1 and 10.
 */
export const listRecordsQuerySchema = z.object({
  type: RecordTypeEnum.optional(),

  category: z.string().trim().optional(),

  startDate: z
    .string()
    .datetime({ message: "startDate must be a valid ISO 8601 datetime string" })
    .optional(),

  endDate: z
    .string()
    .datetime({ message: "endDate must be a valid ISO 8601 datetime string" })
    .optional(),

  page: z.coerce
    .number()
    .int("Page must be an integer")
    .min(1, "Page must be >= 1")
    .optional()
    .default(1),

  limit: z.coerce
    .number()
    .int("Limit must be an integer")
    .min(1, "Limit must be >= 1")
    .max(100, "Limit must be <= 100")
    .optional()
    .default(10),
});

// ── Exported types ──────────────────────────────────────────
export type CreateRecordInput = z.infer<typeof createRecordSchema>;
export type UpdateRecordInput = z.infer<typeof updateRecordSchema>;
export type ListRecordsQuery = z.infer<typeof listRecordsQuerySchema>;
