import "dotenv/config";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";

import analyticsRoutes from "./routes/analytics.js";
import dogRoutes from "./routes/dogRoutes.js";
import kofiRoutes from "./routes/kofiRoutes.js";
import projectRoutes from "./routes/projects.js";

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Absolute path to the built React app
// From backend/server/ we go up two levels to reach frontend/web/dist
const DIST_DIR = path.resolve(__dirname, "../../frontend/web/dist");

/* ===============================
   CORE MIDDLEWARE
=============================== */

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

/* ===============================
   STATIC FILES
=============================== */

app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/public", express.static(path.join(__dirname, "public")));

// Serve the built React app's static assets (JS, CSS, images, etc.)
app.use(express.static(DIST_DIR));

/* ===============================
   API ROUTES
=============================== */

app.use("/api/analytics", analyticsRoutes);
app.use("/api/dog", dogRoutes);
app.use("/api/kofi", kofiRoutes);
app.use("/api/projects", projectRoutes);

/* ===============================
   HEALTH CHECK
=============================== */

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "backend" });
});

/* ===============================
   SPA FALLBACK
   Must be last. Any route that did not match an API
   route or a static file gets the React index.html.
   React Router takes it from there.
=============================== */

app.get("*", (_req, res) => {
  res.sendFile(path.join(DIST_DIR, "index.html"));
});

/* ===============================
   SERVER START
=============================== */

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});