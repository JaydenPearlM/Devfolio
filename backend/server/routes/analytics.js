import express from "express";
import {
  recordPageview,
  recordLoadTime,
  recordProjectImpression,
  recordProjectClick,
  recordResumeClick,
  recordClientError,
  recordSessionEnd,
  recordCtaClick,
  ping,
  getAnalytics,
  publicSummary,
  resetAnalytics,
} from "../controllers/analyticsController.js";

const router = express.Router();

// POST endpoints - record analytics events
router.post("/pageview", recordPageview);
router.post("/load-time", recordLoadTime);
router.post("/project-impression", recordProjectImpression);
router.post("/project-click", recordProjectClick);
router.post("/resume-click", recordResumeClick);
router.post("/client-error", recordClientError);
router.post("/session-end", recordSessionEnd);
router.post("/cta-click", recordCtaClick);

// GET endpoints - retrieve analytics data
router.get("/ping", ping);
router.get("/public", publicSummary);
router.get("/", getAnalytics);

// POST /api/analytics/reset - admin endpoint
router.post("/reset", resetAnalytics);

export default router;