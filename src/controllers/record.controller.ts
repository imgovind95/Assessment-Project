// ─────────────────────────────────────────────────────────────
// Financial Record Controller
// ─────────────────────────────────────────────────────────────
// The traffic cop for financial records. Validates incoming
// requests and routes them to the right service functions.
// ─────────────────────────────────────────────────────────────

import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../utils/apiResponse";
import {
  createRecordSchema,
  updateRecordSchema,
  listRecordsQuerySchema,
} from "../validators/record.validator";
import { uuidParamSchema } from "../validators/user.validator";
import * as recordService from "../services/record.service";

/**
 * POST /api/records
 * logs a new financial entry (only for Analysts and Admins).
 */
export const createRecord = asyncHandler(
  async (req: Request, res: Response) => {
    // let's check if the raw JSON is actually what we expect
    const parseResult = createRecordSchema.safeParse(req.body);

    if (!parseResult.success) {
      const errors = parseResult.error.errors.map((e) => ({
        field: e.path.join("."),
        message: e.message,
      }));
      ApiResponse(res, 400, "Validation failed", undefined, errors);
      return;
    }

    // cool, it's valid. save it and tag the current user as the creator
    const record = await recordService.createRecord(
      parseResult.data,
      req.user!.userId
    );
    ApiResponse(res, 201, "Financial record created successfully", record);
  }
);

/**
 * GET /api/records
 * hands back a list of records. you can pass in filters, or just 
 * let it return the default first page.
 */
export const listRecords = asyncHandler(async (req: Request, res: Response) => {
  // query params can be messy, so we parse them through Zod first
  const parseResult = listRecordsQuerySchema.safeParse(req.query);

  if (!parseResult.success) {
    const errors = parseResult.error.errors.map((e) => ({
      field: e.path.join("."),
      message: e.message,
    }));
    ApiResponse(res, 400, "Invalid query parameters", undefined, errors);
    return;
  }

  // ask the service to do the heavy lifting
  const result = await recordService.listRecords(parseResult.data);
  ApiResponse(res, 200, "Financial records retrieved successfully", result);
});

/**
 * GET /api/records/:id
 * fetches exactly one record if you know its ID.
 */
export const getRecord = asyncHandler(async (req: Request, res: Response) => {
  // make sure it actually looks like a real ID (UUID)
  const paramResult = uuidParamSchema.safeParse(req.params);
  if (!paramResult.success) {
    ApiResponse(res, 400, "Invalid record ID format");
    return;
  }

  try {
    const record = await recordService.getRecordById(paramResult.data.id);
    ApiResponse(res, 200, "Financial record retrieved successfully", record);
  } catch (error: any) {
    const status = error.statusCode || 500;
    ApiResponse(res, status, error.message);
  }
});

/**
 * PUT /api/records/:id
 * changes stuff on a record (Admin only territory).
 */
export const updateRecord = asyncHandler(
  async (req: Request, res: Response) => {
    // gotta validate the ID in the URL...
    const paramResult = uuidParamSchema.safeParse(req.params);
    if (!paramResult.success) {
      ApiResponse(res, 400, "Invalid record ID format");
      return;
    }

    // ...and also the new data they sent in the body
    const bodyResult = updateRecordSchema.safeParse(req.body);
    if (!bodyResult.success) {
      const errors = bodyResult.error.errors.map((e) => ({
        field: e.path.join("."),
        message: e.message,
      }));
      ApiResponse(res, 400, "Validation failed", undefined, errors);
      return;
    }

    try {
      // pass both the ID and the new content to the service
      const record = await recordService.updateRecord(
        paramResult.data.id,
        bodyResult.data
      );
      ApiResponse(res, 200, "Financial record updated successfully", record);
    } catch (error: any) {
      const status = error.statusCode || 500;
      ApiResponse(res, status, error.message);
    }
  }
);

/**
 * DELETE /api/records/:id
 * "deletes" a record (really just hides it). Admins only.
 */
export const deleteRecord = asyncHandler(
  async (req: Request, res: Response) => {
    // valid ID check, as usual
    const paramResult = uuidParamSchema.safeParse(req.params);
    if (!paramResult.success) {
      ApiResponse(res, 400, "Invalid record ID format");
      return;
    }

    try {
      // let the service flip the deleted flag
      await recordService.deleteRecord(paramResult.data.id);
      ApiResponse(res, 200, "Financial record deleted successfully");
    } catch (error: any) {
      const status = error.statusCode || 500;
      ApiResponse(res, status, error.message);
    }
  }
);
