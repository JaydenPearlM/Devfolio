import express from "express";
import { createClient } from "@supabase/supabase-js";

const router = express.Router();

// Initialize Supabase client for analytics storage
let supabase = null;

const SUPABASE_URL = process.env.SUPABASE_URL?.trim();
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

if (SUPABASE_URL && SUPABASE_SERVICE_KEY) {
  try {
    supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  } catch (error) {
    console.error("Failed to initialize Supabase client:", error);
  }
}

// Helper to check if analytics is configured
function isAnalyticsEnabled() {
  return supabase !== null;
}

// Graceful fallback for all analytics routes
function handleAnalyticsRequest(handler) {
  return async (req, res) => {
    try {
      if (!isAnalyticsEnabled()) {
        // Silently succeed when analytics isn't configured
        return res.json({ ok: true, skipped: true });
      }
      await handler(req, res);
    } catch (error) {
      console.error("Analytics error:", error);
      // Return success even on error to avoid breaking the frontend
      res.json({ ok: true, error: error.message });
    }
  };
}

// POST /api/analytics/pageview
router.post(
  "/pageview",
  handleAnalyticsRequest(async (req, res) => {
    const { path } = req.body;
    
    const { error } = await supabase.from("analytics_pageviews").insert({
      path: path || "/",
      timestamp: new Date().toISOString(),
    });

    if (error) throw error;
    res.json({ ok: true });
  })
);

// POST /api/analytics/load-time
router.post(
  "/load-time",
  handleAnalyticsRequest(async (req, res) => {
    const { path, ms } = req.body;

    const { error } = await supabase.from("analytics_load_times").insert({
      path: path || "/",
      load_time_ms: ms || 0,
      timestamp: new Date().toISOString(),
    });

    if (error) throw error;
    res.json({ ok: true });
  })
);

// POST /api/analytics/project-impression
router.post(
  "/project-impression",
  handleAnalyticsRequest(async (req, res) => {
    const { projectId, meta } = req.body;

    const { error } = await supabase.from("analytics_project_impressions").insert({
      project_id: projectId,
      meta: meta || {},
      timestamp: new Date().toISOString(),
    });

    if (error) throw error;
    res.json({ ok: true });
  })
);

// POST /api/analytics/project-click
router.post(
  "/project-click",
  handleAnalyticsRequest(async (req, res) => {
    const { projectId, meta } = req.body;

    const { error } = await supabase.from("analytics_project_clicks").insert({
      project_id: projectId,
      meta: meta || {},
      timestamp: new Date().toISOString(),
    });

    if (error) throw error;
    res.json({ ok: true });
  })
);

// POST /api/analytics/resume-click
router.post(
  "/resume-click",
  handleAnalyticsRequest(async (req, res) => {
    const { path, meta } = req.body;

    const { error } = await supabase.from("analytics_resume_clicks").insert({
      path: path || "/",
      meta: meta || {},
      timestamp: new Date().toISOString(),
    });

    if (error) throw error;
    res.json({ ok: true });
  })
);

// POST /api/analytics/client-error
router.post(
  "/client-error",
  handleAnalyticsRequest(async (req, res) => {
    const { path, meta } = req.body;

    const { error } = await supabase.from("analytics_client_errors").insert({
      path: path || "/",
      meta: meta || {},
      timestamp: new Date().toISOString(),
    });

    if (error) throw error;
    res.json({ ok: true });
  })
);

// POST /api/analytics/session-end
router.post(
  "/session-end",
  handleAnalyticsRequest(async (req, res) => {
    const { path, reason, duration_ms } = req.body;

    const { error } = await supabase.from("analytics_sessions").insert({
      path: path || "/",
      reason: reason || "unknown",
      duration_ms: duration_ms || 0,
      timestamp: new Date().toISOString(),
    });

    if (error) throw error;
    res.json({ ok: true });
  })
);

// POST /api/analytics/cta-click
router.post(
  "/cta-click",
  handleAnalyticsRequest(async (req, res) => {
    const { name, path, source, meta } = req.body;

    const { error } = await supabase.from("analytics_cta_clicks").insert({
      name: name || "unknown",
      path: path || "/",
      source: source || null,
      meta: meta || {},
      timestamp: new Date().toISOString(),
    });

    if (error) throw error;
    res.json({ ok: true });
  })
);

// GET /api/analytics/public (public summary)
router.get(
  "/public",
  handleAnalyticsRequest(async (req, res) => {
    const days = parseInt(req.query.range) || 7;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    // Get pageview count
    const { count: pageviews } = await supabase
      .from("analytics_pageviews")
      .select("*", { count: "exact", head: true })
      .gte("timestamp", since);

    // Get project clicks
    const { count: projectClicks } = await supabase
      .from("analytics_project_clicks")
      .select("*", { count: "exact", head: true })
      .gte("timestamp", since);

    res.json({
      ok: true,
      days,
      pageviews: pageviews || 0,
      projectClicks: projectClicks || 0,
    });
  })
);

// GET /api/analytics (protected full analytics)
router.get(
  "/",
  handleAnalyticsRequest(async (req, res) => {
    // This would normally check authentication
    // For now, return basic data
    const days = parseInt(req.query.range) || 7;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    const { data: pageviews } = await supabase
      .from("analytics_pageviews")
      .select("*")
      .gte("timestamp", since)
      .order("timestamp", { ascending: false })
      .limit(100);

    res.json({
      ok: true,
      days,
      pageviews: pageviews || [],
    });
  })
);

// POST /api/analytics/reset (protected)
router.post(
  "/reset",
  handleAnalyticsRequest(async (req, res) => {
    // This would normally check admin authentication
    // For now, just return success without doing anything
    res.json({ ok: true, message: "Analytics reset not implemented" });
  })
);

export default router;