// backend/server/index.js
require("dotenv").config();

const express = require("express");
const path = require("path");

// NOTE: You said "NO CORS" — so we won't enable permissive CORS here.
// Use Vite dev proxy for local dev instead (recommended).

const adminAuthRoutes = require("./routes/adminAuth");
const projectRoutes = require("./routes/project");
const analyticsRoutes = require("./routes/analytics");
const dogRoutes = require("./routes/dogRoutes");
const kofiRoutes = require("./routes/kofiRoutes");

const app = express();
const PORT = Number(process.env.PORT || 5000);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Static file serving
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/demos", express.static(path.join(__dirname, "public", "demos")));

// API routes
app.use("/api/admin", adminAuthRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/dog", dogRoutes);
app.use("/api/kofi", kofiRoutes);

// Health
app.get("/api/health", (_req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

// Root
app.get("/", (_req, res) => {
  res.status(200).send("Devfolio backend running. Try /api/health");
});

app.listen(PORT, () => {
  console.log(`[server] listening on http://localhost:${PORT}`);
});