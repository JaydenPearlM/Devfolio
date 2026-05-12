// Do not delete

import express from "express";
import {
  getAnalytics,
  publicSummary,
  ping,
  recordPageview,
  recordLoadTime,
  recordProjectImpression,
  recordProjectClick,
  recordResumeClick,
  recordClientError,
  recordSessionEnd,
  recordCtaClick,
  resetAnalytics,
} from "../controllers/analyticsController.js";

const router = express.Router();

/* ===============================
   READ ANALYTICS
=============================== */

router.get("/", getAnalytics);
router.get("/public", publicSummary);
router.get("/ping", ping);

/* ===============================
   TRACKING EVENTS
=============================== */

router.post("/pageview", recordPageview);
router.post("/load-time", recordLoadTime);
router.post("/project-impression", recordProjectImpression);
router.post("/project-click", recordProjectClick);
router.post("/resume-click", recordResumeClick);
router.post("/cta-click", recordCtaClick);

// Legacy alias kept for compatibility
router.post("/resumeClicks", recordResumeClick);

// Error + session tracking
router.post("/client-error", recordClientError);
router.post("/session-end", recordSessionEnd);

/* ===============================
   MAINTENANCE
=============================== */

router.post("/reset", resetAnalytics);

export default router;