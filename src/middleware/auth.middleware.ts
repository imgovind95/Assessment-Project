// ─────────────────────────────────────────────────────────────
// Authentication Middleware
// ─────────────────────────────────────────────────────────────
// basically checks if the user is who they say they are, 
// and hands them their decoded JWT payload on a silver platter.
// ─────────────────────────────────────────────────────────────

import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { ApiResponse } from "../utils/apiResponse";

/** what we expect to find inside the token */
interface JwtPayload {
  userId: string;
  role: string;
}

/**
 * the bouncer. makes sure everyone walking through the door 
 * actually has a valid ticket (token).
 *
 * Expects header:  Authorization: Bearer <token>
 */
export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;

    // didn't bring a token or formatted it wrong? nope.
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      ApiResponse(res, 401, "Authentication required. Please provide a valid token.");
      return;
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      ApiResponse(res, 401, "Authentication required. Token is missing.");
      return;
    }

    // let's see if this token is legit
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error("JWT_SECRET is not configured");
    }

    const decoded = jwt.verify(token, secret) as JwtPayload;

    // stick the user info onto the request so the next guys can use it
    req.user = {
      userId: decoded.userId,
      role: decoded.role as any,
    };

    next(); // all good, go on through
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      ApiResponse(res, 401, "Token has expired. Please login again.");
      return;
    }
    if (error instanceof jwt.JsonWebTokenError) {
      ApiResponse(res, 401, "Invalid token. Please login again.");
      return;
    }
    ApiResponse(res, 500, "Internal server error during authentication.", undefined, error);
  }
};
