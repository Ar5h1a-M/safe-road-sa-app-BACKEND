import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";


import authRoutes from "./routes/auth.js";


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
console.log("Routes loaded successfully!");

// Error handler
app.use((err, req, res, _next) => {
  console.error("UNHANDLED ERROR:", err);
  res.status(500).json({ error: err?.message || "Internal Server Error" });
});



const PORT = process.env.PORT || 4001;
app.listen(PORT, () => console.log(`Backend on :${PORT}`));


export default app;
