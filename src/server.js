import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";

import authRoutes from "./routes/auth.js";
import reportsRouter from "./routes/reports.js";
import savedRoutesRouter from "./routes/saved_routes.js";

const app = express();

// CORS: allow Authorization header so partners can auth from Swagger UI
app.use(
  cors({
    origin: "*",
    methods: "GET,POST,PUT,DELETE,OPTIONS",
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());

// Health check root (keep your current behavior)
app.get("/", (_req, res) => {
  res.json({ ok: true, service: "LockedIn backend", ts: Date.now() });
});

// Optional: separate health path too
app.get("/health", (_req, res) => res.json({ ok: true }));

console.log("Supabase URL:", process.env.SUPABASE_URL);



// Mount routes
console.log("Loading routes...");
app.use("/api/auth", authRoutes);     // -> /api/auth/login, /api/auth/signup
app.use("/api/reports", reportsRouter);
app.use("/api/routes", savedRoutesRouter);  // -> Saved Routes
console.log("Routes loaded successfully!");


// Error handler
app.use((err, req, res, _next) => {
  console.error("UNHANDLED ERROR:", err);
  res.status(500).json({ error: err?.message || "Internal Server Error" });
});

// Environment validation
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing required environment variables");
  process.exit(1);
}

const PORT = process.env.PORT || 4001;

const server = app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  server.close(() => {
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  server.close(() => {
    process.exit(0);
  });
});

export default app;