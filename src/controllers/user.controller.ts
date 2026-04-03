// ─────────────────────────────────────────────────────────────
// User Controller (Admin-only)
// ─────────────────────────────────────────────────────────────
// Handles all the admin stuff — listing users, banning them,
// or promoting them to a new role.
// ─────────────────────────────────────────────────────────────

import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../utils/apiResponse";
import {
  updateStatusSchema,
  updateRoleSchema,
  uuidParamSchema,
} from "../validators/user.validator";
import * as userService from "../services/user.service";

/**
 * GET /api/users
 * grabs the full list of users in the system.
 */
export const getAllUsers = asyncHandler(async (_req: Request, res: Response) => {
  const users = await userService.getAllUsers();
  ApiResponse(res, 200, "Users retrieved successfully", users);
});

/**
 * PATCH /api/users/:id/status
 * flips a user's active status (aka bans or unbans them).
 */
export const updateStatus = asyncHandler(
  async (req: Request, res: Response) => {
    // gotta make sure the ID in the URL is a real UUID
    const paramResult = uuidParamSchema.safeParse(req.params);
    if (!paramResult.success) {
      const errors = paramResult.error.errors.map((e) => ({
        field: e.path.join("."),
        message: e.message,
      }));
      ApiResponse(res, 400, "Invalid user ID", undefined, errors);
      return;
    }

    // check if they sent a valid boolean for isActive
    const bodyResult = updateStatusSchema.safeParse(req.body);
    if (!bodyResult.success) {
      const errors = bodyResult.error.errors.map((e) => ({
        field: e.path.join("."),
        message: e.message,
      }));
      ApiResponse(res, 400, "Validation failed", undefined, errors);
      return;
    }

    try {
      const user = await userService.updateUserStatus(
        paramResult.data.id,
        bodyResult.data.isActive
      );
      ApiResponse(res, 200, "User status updated successfully", user);
    } catch (error: any) {
      // couldn't find the user? let 'em know
      const status = error.statusCode || 500;
      ApiResponse(res, status, error.message);
    }
  }
);

/**
 * PATCH /api/users/:id/role
 * changes what a user is allowed to do.
 */
export const updateRole = asyncHandler(async (req: Request, res: Response) => {
  // check the URL ID again
  const paramResult = uuidParamSchema.safeParse(req.params);
  if (!paramResult.success) {
    const errors = paramResult.error.errors.map((e) => ({
      field: e.path.join("."),
      message: e.message,
    }));
    ApiResponse(res, 400, "Invalid user ID", undefined, errors);
    return;
  }

  // check if the role they sent actually exists
  const bodyResult = updateRoleSchema.safeParse(req.body);
  if (!bodyResult.success) {
    const errors = bodyResult.error.errors.map((e) => ({
      field: e.path.join("."),
      message: e.message,
    }));
    ApiResponse(res, 400, "Validation failed", undefined, errors);
    return;
  }

  try {
    const user = await userService.updateUserRole(
      paramResult.data.id,
      bodyResult.data.role
    );
    ApiResponse(res, 200, "User role updated successfully", user);
  } catch (error: any) {
    const status = error.statusCode || 500;
    ApiResponse(res, status, error.message);
  }
});
