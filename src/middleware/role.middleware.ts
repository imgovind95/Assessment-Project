// ─────────────────────────────────────────────────────────────
// Role-Based Access Control Middleware
// ─────────────────────────────────────────────────────────────
// kicks out anyone who doesn't have the right clearance level.
// needs to run strictly AFTER the auth middleware.
// ─────────────────────────────────────────────────────────────

import { Request, Response, NextFunction } from "express";
import { ApiResponse } from "../utils/apiResponse";

/**
 * a handy factory function that builds a custom bouncer 
 * for whatever roles you pass in.
 *
 * @example
 *   router.post("/records", authenticate, authorise("ADMIN", "ANALYST"), createRecord);
 */
export const authorise = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    // wait, did they even pass the first security check?
    if (!req.user) {
      ApiResponse(res, 401, "Authentication required.");
      return;
    }

    // viewer trying to delete? nope, get out
    if (!allowedRoles.includes(req.user.role as string)) {
      ApiResponse(
        res,
        403,
        `Access denied. This action requires one of the following roles: ${allowedRoles.join(", ")}. Your role: ${req.user.role}.`
      );
      return;
    }

    next(); // role checks out, proceed
  };
};
