// ─────────────────────────────────────────────────────────────
// Application Entry Point
// ─────────────────────────────────────────────────────────────
// This is where everything starts. We set up Express, plug in
// our routes, connect to the database, and start listening.
// ─────────────────────────────────────────────────────────────

import dotenv from "dotenv";
dotenv.config(); // grab env vars before we do anything else

import express, { Request, Response, NextFunction } from "express";
import cors from "cors";

// ── Route imports ───────────────────────────────────────────
import authRoutes from "./routes/auth.routes";
import userRoutes from "./routes/user.routes";
import recordRoutes from "./routes/record.routes";
import dashboardRoutes from "./routes/dashboard.routes";

// ── Utilities ───────────────────────────────────────────────
import { ApiResponse } from "./utils/apiResponse";

// ── Prisma client (singleton) ───────────────────────────────
// importing this dynamically because the IDE gets weird about generated types
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// ── Express app ─────────────────────────────────────────────
const app = express();
const PORT = process.env.PORT || 3000;

// ── Global middleware ───────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: "10mb" })); // don't let people upload massive JSON payloads
app.use(express.urlencoded({ extended: true }));

// ── Health check ────────────────────────────────────────────
// super simple route just to see if the server is awake
app.get("/api/health", (_req: Request, res: Response) => {
  ApiResponse(res, 200, "Finance Backend API is running", {
    status: "healthy",
    timestamp: new Date().toISOString(),
  });
});

// ── API Routes ──────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/records", recordRoutes);
app.use("/api/dashboard", dashboardRoutes);

// ── 404 handler — catch unmatched routes ────────────────────
// if they ask for a route that doesn't exist, handle it nicely
app.use((_req: Request, res: Response) => {
  ApiResponse(res, 404, "The requested resource was not found");
});

// ── Global error handler ────────────────────────────────────
// Express needs all 4 params here to know this is the error handler.
// Whenever something throws an error, it ends up here.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Unhandled error:", err);

  ApiResponse(
    res,
    500,
    "An unexpected error occurred",
    undefined,
    // only show the real error message if we're not in production (security first!)
    process.env.NODE_ENV !== "production" ? err.message : undefined
  );
});

// ── Start server ────────────────────────────────────────────
const startServer = async () => {
  try {
    // make sure the database is actually reachable before starting
    await prisma.$connect();
    console.log("✅ Database connected successfully");

    app.listen(PORT, () => {
      console.log(`🚀 Server is running on http://localhost:${PORT}`);
      console.log(`📋 Health check: http://localhost:${PORT}/api/health`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1); // crash the app if we can't start properly
  }
};

startServer();

// ── Graceful shutdown ───────────────────────────────────────
// cleanly close the database connection if someone presses Ctrl+C
process.on("SIGINT", async () => {
  console.log("\n🛑 Shutting down gracefully...");
  await prisma.$disconnect();
  process.exit(0);
});

// same idea but for when the server receives a terminate signal
process.on("SIGTERM", async () => {
  console.log("\n🛑 Shutting down gracefully...");
  await prisma.$disconnect();
  process.exit(0);
});

export default app;
