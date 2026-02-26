// server/routes/analytics.js
const express = require("express");
const router = express.Router();

const analyticsCtrl = require("../controllers/analyticsController");
const { verifyAdmin } = require("../middleware/auth");

/* ─────────────── Diagnostics ─────────────── */
try {
  console.log("[analyticsCtrl keys]", Object.keys(analyticsCtrl));
} catch {
  /* ignore */
}

// Helper: fallback if handler missing
function ensure(fn, name) {
  if (typeof fn !== "function") {
    console.error(`[analytics] Missing handler: ${name} (got ${typeof fn})`);
    return (_req, res) =>
      res.status(500).json({ error: `Handler ${name} is undefined` });
  }
  return fn;
}

/* ─────────────── PUBLIC (no auth) — write-only beacons ─────────────── */
// Same-origin beacons (NO CORS)
router.get("/ping", ensure(analyticsCtrl.ping, "ping"));

router.post("/pageview", ensure(analyticsCtrl.recordPageview, "recordPageview"));
router.post("/project-click", ensure(analyticsCtrl.recordProjectClick, "recordProjectClick"));
router.post("/resume-click", ensure(analyticsCtrl.recordResumeClick, "recordResumeClick")); // ✅ official route
//router.post("/resumeClicks", ensure(analyticsCtrl.recordResumeClick, "recordResumeClick")); // legacy alias
router.post("/load-time", ensure(analyticsCtrl.recordLoadTime, "recordLoadTime"));
router.post("/client-error", ensure(analyticsCtrl.recordClientError, "recordClientError"));
router.post("/session-end", ensure(analyticsCtrl.recordSessionEnd, "recordSessionEnd"));

// Compact public summary for homepage widgets/cards
router.get("/public", ensure(analyticsCtrl.getPublicSummary, "getPublicSummary"));
// ...existing imports and routes above...
router.get("/debug-types", verifyAdmin, analyticsCtrl.debugEventTypes);

/* ─────────────── ADMIN (auth) — dashboard & maintenance ─────────────── */
const getAnalyticsHandler =
  analyticsCtrl.getAnalytics || analyticsCtrl.getAnalyticsSummary;

router.get(
  "/",
  verifyAdmin,
  ensure(
    getAnalyticsHandler,
    getAnalyticsHandler === analyticsCtrl.getAnalytics
      ? "getAnalytics"
      : "getAnalyticsSummary"
  )
);

// Admin-only reset (clears analytics_events table)
router.post("/reset", verifyAdmin, ensure(analyticsCtrl.resetAnalytics, "resetAnalytics"));
router.delete("/reset", verifyAdmin, ensure(analyticsCtrl.resetAnalytics, "resetAnalytics")); // alias for safety

module.exports = router;
