// ─────────────────────────────────────────────────────────────
// Auth Controller
// ─────────────────────────────────────────────────────────────
// The middleman for auth stuff. It checks if the input looks 
// okay, asks the service layer to do the real work, and then 
// packages up the response for the client.
// ─────────────────────────────────────────────────────────────

import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../utils/apiResponse";
import { registerSchema, loginSchema } from "../validators/auth.validator";
import * as authService from "../services/auth.service";

/**
 * POST /api/auth/register
 * signs up a new user and hands back their first token.
 */
export const register = asyncHandler(async (req: Request, res: Response) => {
  // make sure they sent us what we need
  const parseResult = registerSchema.safeParse(req.body);

  if (!parseResult.success) {
    const errors = parseResult.error.errors.map((e) => ({
      field: e.path.join("."),
      message: e.message,
    }));
    // bad input? let them know exactly what went wrong
    ApiResponse(res, 400, "Validation failed", undefined, errors);
    return;
  }

  try {
    // try to register 'em
    const { user, token } = await authService.register(parseResult.data);
    ApiResponse(res, 201, "User registered successfully", { user, token });
  } catch (error: any) {
    // email taken? some other issue? send the error back
    const status = error.statusCode || 500;
    ApiResponse(res, status, error.message);
  }
});

/**
 * POST /api/auth/login
 * checks credentials and issues a fresh token if everything matches.
 */
export const login = asyncHandler(async (req: Request, res: Response) => {
  // same drill, check the input format first
  const parseResult = loginSchema.safeParse(req.body);

  if (!parseResult.success) {
    const errors = parseResult.error.errors.map((e) => ({
      field: e.path.join("."),
      message: e.message,
    }));
    ApiResponse(res, 400, "Validation failed", undefined, errors);
    return;
  }

  try {
    // log them in!
    const { user, token } = await authService.login(parseResult.data);
    ApiResponse(res, 200, "Login successful", { user, token });
  } catch (error: any) {
    // wrong password or inactive account? reject it here
    const status = error.statusCode || 500;
    ApiResponse(res, status, error.message);
  }
});
