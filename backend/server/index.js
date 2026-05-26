import "dotenv/config";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

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

// Security headers
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"], // React needs inline scripts
        styleSrc: ["'self'", "'unsafe-inline'"], // Tailwind needs inline styles
        imgSrc: ["'self'", "data:", "https:", "blob:"],
        connectSrc: ["'self'", "https://*.supabase.co"],
        fontSrc: ["'self'", "data:"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false, // Allow embedding resources
    crossOriginResourcePolicy: { policy: "cross-origin" }, // Allow CORS resources
  })
);

/* ===============================
   STATIC FILES
=============================== */

app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/public", express.static(path.join(__dirname, "public")));

// Serve the built React app's static assets (JS, CSS, images, etc.)
app.use(
  express.static(DIST_DIR, {
    index: false,
    setHeaders: (res, filePath) => {
      if (filePath.endsWith("index.html")) {
        res.setHeader("Cache-Control", "no-store");
      } else {
        res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      }
    },
  })
);

app.use(
  "/assets",
  express.static(path.join(DIST_DIR, "assets"), {
    fallthrough: false,
    immutable: true,
    maxAge: "1y",
  })
);

/* ===============================
   RATE LIMITING
=============================== */

// General API rate limiter - 100 requests per 15 minutes per IP
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: "Too many requests from this IP, please try again later.",
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Stricter rate limit for analytics endpoints - 30 per 15 minutes
const analyticsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: {
    error: "Too many analytics requests, please slow down.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Very strict for admin operations - 10 per 15 minutes
const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    error: "Too many admin requests, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/* ===============================
   API ROUTES
=============================== */

app.use("/api/analytics", analyticsLimiter, analyticsRoutes);
app.use("/api/dog", apiLimiter, dogRoutes);
app.use("/api/kofi", apiLimiter, kofiRoutes);
app.use("/api/projects", adminLimiter, projectRoutes);

/* ===============================
   HEALTH CHECK
=============================== */

app.get("/api/health", async (_req, res) => {
  const startTime = Date.now();
  const health = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    service: "backend",
    uptime: process.uptime(),
    checks: {},
  };

  // Check database connectivity
  try {
    const { getClient } = await import("./utils/supabase.js");
    const supabase = getClient();
    
    const { data, error } = await supabase
      .from("Devfolio")
      .select("id")
      .limit(1);

    if (error) {
      health.checks.database = {
        status: "unhealthy",
        message: error.message,
        responseTime: Date.now() - startTime,
      };
      health.status = "degraded";
    } else {
      health.checks.database = {
        status: "healthy",
        responseTime: Date.now() - startTime,
      };
    }
  } catch (err) {
    health.checks.database = {
      status: "unhealthy",
      message: String(err?.message || err),
      responseTime: Date.now() - startTime,
    };
    health.status = "unhealthy";
  }

  // Check memory usage
  const memUsage = process.memoryUsage();
  health.checks.memory = {
    status: "healthy",
    heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
    heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
  };

  // Return appropriate status code
  const statusCode = health.status === "unhealthy" ? 503 : 200;
  
  res.status(statusCode).json(health);
});

/* ===============================
   ASSET FALLBACK
   Prevent missing JS/CSS files from returning index.html.
   This fixes MIME type errors after deploys/cached assets.
=============================== */

app.get("/assets/*", (_req, res) => {
  res.status(404).type("text/plain").send("Asset not found");
});

/* ===============================
   SPA FALLBACK
   Must be last. Any route that did not match an API
   route or a static file gets the React index.html.
   React Router takes it from there.
=============================== */

app.get("*", (_req, res) => {
  res.setHeader(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, proxy-revalidate"
  );
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  res.sendFile(path.join(DIST_DIR, "index.html"));
});

/* ===============================
   SERVER START
=============================== */

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});