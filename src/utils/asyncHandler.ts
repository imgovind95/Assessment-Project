// ─────────────────────────────────────────────────────────────
// Async Handler Wrapper
// ─────────────────────────────────────────────────────────────
// Eliminates repetitive try/catch blocks in every controller.
// Wraps an async Express handler so that rejected promises are
// forwarded to Express's global error handler automatically.
// ─────────────────────────────────────────────────────────────

import { Request, Response, NextFunction, RequestHandler } from "express";

type AsyncRequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<unknown>;

/**
 * Wrap an async route handler so that any thrown / rejected error
 * is caught and passed to `next()`.
 */
export const asyncHandler = (fn: AsyncRequestHandler): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
