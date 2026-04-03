// ─────────────────────────────────────────────────────────────
// Standardised API Response Utility
// ─────────────────────────────────────────────────────────────
// Every endpoint MUST use this helper so that consumers always
// receive a predictable envelope:
//   { success, message, data?, error? }
// ─────────────────────────────────────────────────────────────

import { Response } from "express";

/** Shape of the JSON body returned to the client. */
interface ApiResponseBody {
  success: boolean;
  message: string;
  data?: unknown;
  error?: unknown;
}

/**
 * Send a uniform JSON response.
 *
 * @param res     - Express response object
 * @param status  - HTTP status code
 * @param message - Human-readable message
 * @param data    - Optional payload
 * @param error   - Optional error details (only in non-production)
 */
export const ApiResponse = (
  res: Response,
  status: number,
  message: string,
  data?: unknown,
  error?: unknown
): Response<ApiResponseBody> => {
  const body: ApiResponseBody = {
    success: status >= 200 && status < 300,
    message,
  };

  if (data !== undefined) body.data = data;

  // Expose error details only in non-production environments
  if (error !== undefined && process.env.NODE_ENV !== "production") {
    body.error = error;
  }

  return res.status(status).json(body);
};
