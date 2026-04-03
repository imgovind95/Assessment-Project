// ─────────────────────────────────────────────────────────────
// Dashboard Controller
// ─────────────────────────────────────────────────────────────
// basically the middleman for all the dashboard widgets.
// ─────────────────────────────────────────────────────────────

import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../utils/apiResponse";
import * as dashboardService from "../services/dashboard.service";

/**
 * GET /api/dashboard/summary
 * fetches the big numbers: total in, total out, and what's left.
 */
export const getSummary = asyncHandler(async (_req: Request, res: Response) => {
  const summary = await dashboardService.getSummary();
  ApiResponse(res, 200, "Dashboard summary retrieved successfully", summary);
});

/**
 * GET /api/dashboard/category-breakdown
 * groups your spending and income by category, useful for pie charts.
 */
export const getCategoryBreakdown = asyncHandler(
  async (_req: Request, res: Response) => {
    const breakdown = await dashboardService.getCategoryBreakdown();
    ApiResponse(
      res,
      200,
      "Category breakdown retrieved successfully",
      breakdown
    );
  }
);

/**
 * GET /api/dashboard/recent
 * grabs the 10 most recent transactions so you can see what just happened.
 */
export const getRecentRecords = asyncHandler(
  async (_req: Request, res: Response) => {
    const records = await dashboardService.getRecentRecords();
    ApiResponse(res, 200, "Recent records retrieved successfully", records);
  }
);

/**
 * GET /api/dashboard/trends
 * gives you the data to draw a 6-month trend line chart.
 */
export const getMonthlyTrends = asyncHandler(
  async (_req: Request, res: Response) => {
    const trends = await dashboardService.getMonthlyTrends();
    ApiResponse(res, 200, "Monthly trends retrieved successfully", trends);
  }
);
