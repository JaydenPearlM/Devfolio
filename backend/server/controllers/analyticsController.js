// server/controllers/analyticsController.js
// Supabase-backed analytics controller (same-origin API; NO CORS)

const { getAdminClient } = require("../utils/supabase");
const crypto = require("crypto");

/* ───────────────────── Day bucketing helpers ───────────────────── */

// UTC day key YYYY-MM-DD
function ymdUTC(d) {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// Local day key using client-provided offset (minutes east of UTC).
// Example: Eastern Standard Time → tzOffset = -300.
function ymdLocal(d, offsetMin = 0) {
  const t = new Date(d.getTime() + offsetMin * 60_000);
  const y = t.getUTCFullYear();
  const m = String(t.getUTCMonth() + 1).padStart(2, "0");
  const day = String(t.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// Choose the right formatter per request; falls back to UTC if missing.
function makeDayKey(req) {
  const off = Number.parseInt(req.query.tzOffset, 10);
  const useLocal = Number.isFinite(off);
  return (date) => (useLocal ? ymdLocal(date, off) : ymdUTC(date));
}

/* ───────────────────────── Utilities ───────────────────────── */

const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
const iso   = (x) => new Date(x).toISOString();

function normalizePath(p) {
  if (!p) return "/";
  try {
    const s = String(p);
    if (s.startsWith("http://") || s.startsWith("https://")) {
      return new URL(s).pathname || "/";
    }
    return s.startsWith("/") ? s : "/" + s;
  } catch {
    return "/";
  }
}

function rangeFromDays(days = 30) {
  const end   = new Date();             // now
  const start = new Date(end);
  // inclusive window: [start, end]
  start.setUTCDate(end.getUTCDate() - Number(days || 30) + 1);
  return { start, end };
}

function ipFrom(req) {
  return (req.headers["x-forwarded-for"] || req.ip || "")
    .toString()
    .split(",")[0] || null;
}

function hashSession(ip, ua) {
  const raw = `${ip || ""}|${ua || ""}`;
  return crypto.createHash("sha1").update(raw).digest("hex").slice(0, 16);
}

/* ─────────────── Project title lookup (Devfolio table) ───────────────
   Your projects live in table "Devfolio" with numeric int8 primary key `id`.
   We hydrate titles so charts never show raw IDs.
----------------------------------------------------------------------- */
async function fetchProjectTitles(supa, ids = []) {
  const uniq = [...new Set((ids || []).filter(Boolean).map(String))];
  if (!uniq.length) return new Map();

  const numericIds = uniq.map((x) => Number(x)).filter((n) => Number.isFinite(n));
  if (!numericIds.length) return new Map();

  const { data, error } = await supa
    .from("Devfolio")
    .select("id, title")
    .in("id", numericIds);

  if (error) {
    console.warn("[analytics] fetchProjectTitles Devfolio lookup error:", error);
    return new Map();
  }

  const map = new Map();
  for (const row of data || []) {
    const title = row.title || String(row.id);
    map.set(String(row.id), title);
  }
  return map;
}

/* ───────────────────────── Insert helper ───────────────────── */

async function insertEvent(req, event_type, fields = {}) {
  const supa        = await getAdminClient();
  const ip          = ipFrom(req);
  const user_agent  = req.get("user-agent") || null;
  const referrer    = req.get("referer") || null;

  // Prefer provided session_id; support camelCase from client (sessionId)
  const session_id =
    fields.session_id ??
    req.body?.session_id ??
    req.body?.sessionId ?? // accept camelCase from client beacons
    hashSession(ip, user_agent);

  // Accept both camelCase and snake_case project id
  const project_id =
    fields.projectId ??
    req.body?.project_id ??
    req.body?.projectId ?? // accept camelCase
    null;

  // Optional JSONB meta (e.g., { source, action, resume_url })
  const meta =
    fields.meta ??
    req.body?.meta ??
    null;

  const payload = {
    event_type,                // text
    ts: new Date(),            // timestamptz
    path: normalizePath(
      fields.path ?? req.body?.path ?? req.query?.path ?? referrer ?? "/"
    ),
    project_id,
    load_ms:
      // accept `ms`, `loadMs`, or `load_ms`
      fields.ms != null
        ? Number(fields.ms)
        : req.body?.ms != null
        ? Number(req.body.ms)
        : req.body?.loadMs != null
        ? Number(req.body.loadMs)
        : req.body?.load_ms != null
        ? Number(req.body.load_ms)
        : null,
    referrer,
    user_agent,
    ip,
    session_id,
    meta, // JSONB
  };

  const { error } = await supa.from("analytics_events").insert(payload);
  if (error) throw error;
  return { ok: true };
}

/* ───────────────────────── Beacon endpoints ─────────────────── */

exports.recordPageview = async (req, res) => {
  try {
    await insertEvent(req, "pageview", { path: req.body?.path });
    res.status(204).end();
  } catch (e) {
    console.error("[analytics] recordPageview", e);
    res.status(500).json({ error: "recordPageview failed" });
  }
};

exports.recordProjectClick = async (req, res) => {
  try {
    const projectId = req.body?.projectId ?? req.body?.project_id ?? null;
    await insertEvent(req, "project_click", { projectId });
    res.status(204).end();
  } catch (e) {
    console.error("[analytics] recordProjectClick", e);
    res.status(500).json({ error: "recordProjectClick failed" });
  }
};

exports.recordResumeClick = async (req, res) => {
  try {
    // Build strong metadata so analytics never loses context
    const meta = {
      source: req.body?.source ?? null,
      action: req.body?.action ?? null,
      resume_url: req.body?.resume_url ?? null,
    };

    await insertEvent(req, "resume_click", {
      path: req.body?.path,
      meta,
    });

    res.status(204).end();
  } catch (e) {
    console.error("[analytics] recordResumeClick", e);
    res.status(500).json({ error: "recordResumeClick failed" });
  }
};

exports.recordLoadTime = async (req, res) => {
  try {
    const ms =
      req.body && req.body.ms != null
        ? Number(req.body.ms)
        : req.body && req.body.loadMs != null
        ? Number(req.body.loadMs)
        : Number(req.body?.load_ms ?? 0);
    await insertEvent(req, "load_time", { ms, path: req.body?.path });
    res.status(204).end();
  } catch (e) {
    console.error("[analytics] recordLoadTime", e);
    res.status(500).json({ error: "recordLoadTime failed" });
  }
};

exports.recordClientError = async (_req, res) => {
  try {
    await insertEvent(_req, "client_error", {});
    res.status(204).end();
  } catch (e) {
    console.error("[analytics] recordClientError", e);
    res.status(500).json({ error: "recordClientError failed" });
  }
};

exports.recordSessionEnd = async (req, res) => {
  try {
    await insertEvent(req, "session_end", { path: req.body?.path });
    res.status(204).end();
  } catch (e) {
    console.error("[analytics] recordSessionEnd", e);
    res.status(500).json({ error: "session_end_failed" });
  }
};

exports.ping = (_req, res) =>
  res.json({ ok: true, at: new Date().toISOString() });

/* ───────────────────────── Public Summary (homepage) ──────────
   GET /api/analytics/public?range=7[&tzOffset=-300]
----------------------------------------------------------------- */
exports.getPublicSummary = async (req, res) => {
  try {
    const dayKey = makeDayKey(req);

    const days  = clamp(parseInt(req.query.range || "7", 10) || 7, 1, 365);
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const supa = await getAdminClient();
    const { data, error } = await supa
      .from("analytics_events")
      .select("ts,event_type,load_ms,project_id")
      .gte("ts", iso(since));
    if (error) throw error;

    const byDayType     = new Map();
    const projectCounts = new Map();

    for (const row of data || []) {
      const dayStr = dayKey(new Date(row.ts));

      // normalize the type
      const t = String(row.event_type || "").trim().toLowerCase();

      const key = `${dayStr}|${t}`;
      const rec = byDayType.get(key) || { day: dayStr, type: t, count: 0, msVals: [] };
      rec.count += 1;
      if (t === "load_time") {
        const n = Number(row.load_ms);
        if (Number.isFinite(n)) rec.msVals.push(n);
      }
      byDayType.set(key, rec);

      if (t === "project_click" && row.project_id) {
        projectCounts.set(row.project_id, (projectCounts.get(row.project_id) || 0) + 1);
      }
    }

    const rows = [...byDayType.values()].sort((a, b) => a.day.localeCompare(b.day));

    const seriesBy = (t) =>
      rows
        .filter((r) => r.type === t)
        .map((r) => ({ day: r.day, count: r.count }));

    const loadAvg = (() => {
      const all = rows.filter((r) => r.type === "load_time").flatMap((r) => r.msVals);
      return all.length
        ? Math.round(all.reduce((a, b) => a + b, 0) / all.length)
        : null;
    })();

    const totals = {
      pageviews: rows.filter((r) => r.type === "pageview").reduce((a, b) => a + b.count, 0),
      resumeClicks: rows.filter((r) => r.type === "resume_click").reduce((a, b) => a + b.count, 0),
      projectClicks: rows.filter((r) => r.type === "project_click").reduce((a, b) => a + b.count, 0),
      errors: rows.filter((r) => r.type === "client_error").reduce((a, b) => a + b.count, 0),
      clientErrors: rows.filter((r) => r.type === "client_error").reduce((a, b) => a + b.count, 0),
      avgLoadMs: loadAvg,
      avgLoadTimeMs: loadAvg,
    };

    // Build and title-ize top projects (limit 5)
    const topProjectsRaw = [...projectCounts.entries()]
      .map(([projectId, count]) => ({ projectId: String(projectId), count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // ✅ Filter out deleted projects (no title = no bar)
    const titleMap     = await fetchProjectTitles(supa, topProjectsRaw.map(p => p.projectId));
    const existingIds  = new Set([...titleMap.keys()].map(String));
    const topProjects  = topProjectsRaw
      .filter(p => existingIds.has(String(p.projectId)))
      .map(p => ({
        projectId: p.projectId,
        clicks:    p.count,
        title:     titleMap.get(String(p.projectId)),
      }));

    res.json({
      rangeDays: days,
      totals,
      series: { pageviews: seriesBy("pageview") },
      top: { projects: topProjects },
    });
  } catch (e) {
    console.error("[analytics] getPublicSummary", e);
    res.status(500).json({ error: "getPublicSummary failed" });
  }
};

// Back-compat alias so routes can use either name without changing logic
exports.publicSummary = exports.getPublicSummary;

/* ───────────────────────── Admin Analytics (dashboard) ────────
   GET /api/analytics?range=30[&tzOffset=-300]
   Returns KPI-friendly shape + rich series.
----------------------------------------------------------------- */
exports.getAnalytics = async (req, res) => {
  try {
    const dayKey         = makeDayKey(req);
    const days           = Number(req.query.days || req.query.range || 30);
    const { start, end } = rangeFromDays(days);
    const supa           = await getAdminClient();

    const { data, error } = await supa
      .from("analytics_events")
      .select("ts,event_type,load_ms,ip,user_agent,project_id,session_id")
      .gte("ts", start.toISOString())
      .lte("ts", end.toISOString());

    if (error) throw error;

    const byDayType      = new Map(); // `${day}|${type}` -> { day, type, count, msList }
    const sessionsPerDay = new Map(); // day -> Set(session_id)
    const projectClicks  = new Map(); // project_id -> count

    for (const row of data || []) {
      const dayStr = dayKey(new Date(row.ts));

      // ✅ normalize type: trim + lowercase (handles stray spaces/case)
      const t = String(row.event_type || "").trim().toLowerCase();

      // Type bucket
      const key = `${dayStr}|${t}`;
      const rec = byDayType.get(key) || { day: dayStr, type: t, count: 0, msList: [] };
      rec.count += 1;

      if (t === "load_time") {
        const n = Number(row.load_ms);
        if (Number.isFinite(n)) rec.msList.push(n);
      }
      byDayType.set(key, rec);

      // Sessions: unique session_id per day (fallback: ip+ua hash)
      if (t === "pageview") {
        const sid = row.session_id || hashSession(row.ip, row.user_agent);
        const set = sessionsPerDay.get(dayStr) || new Set();
        set.add(sid);
        sessionsPerDay.set(dayStr, set);
      }

      // Top projects
      if (t === "project_click" && row.project_id) {
        projectClicks.set(row.project_id, (projectClicks.get(row.project_id) || 0) + 1);
      }
    }

    const rows = Array.from(byDayType.values()).sort((a, b) => a.day.localeCompare(b.day));

    const seriesBy = (type) =>
      rows
        .filter((r) => r.type === type)
        .map((r) => ({
          day: r.day,
          count: r.count,
          avgMs: r.msList.length
            ? Math.round(r.msList.reduce((a, b) => a + b, 0) / r.msList.length)
            : null,
        }));

    const pageviews           = seriesBy("pageview");
    const projectClicksSeries = seriesBy("project_click");
    const resumeClicksSeries  = seriesBy("resume_click");
    const loadTimes           = seriesBy("load_time");
    const errorsSeries        = seriesBy("client_error");

    const sessionsDaily = Array.from(sessionsPerDay.entries())
      .map(([dayStr, set]) => ({ date: dayStr, count: set.size }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const sumCounts = (arr) => arr.reduce((a, b) => a + (b.count || 0), 0);
    const avgLoadMs = (() => {
      const pts = loadTimes.map((d) => d.avgMs).filter((v) => Number.isFinite(v));
      return pts.length ? Math.round(pts.reduce((a, b) => a + b, 0) / pts.length) : 0;
    })();

    const topProjectsRaw = Array.from(projectClicks.entries())
      .map(([projectId, count]) => ({ projectId: String(projectId), count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const titleMap    = await fetchProjectTitles(supa, topProjectsRaw.map(p => p.projectId));
    const existingIds = new Set([...titleMap.keys()].map(String));

    const topProjects = topProjectsRaw
      .filter(p => existingIds.has(String(p.projectId))) // ✅ drop deleted projects
      .map(p => ({
        projectId: p.projectId,
        clicks:    p.count,
        title:     titleMap.get(String(p.projectId)),
      }));

    // KPI tiles
    const totals = {
      resumeClicks:  sumCounts(resumeClicksSeries),
      pageviews:     sumCounts(pageviews),
      sessions:      sumCounts(sessionsDaily),
      avgLoadTimeMs: avgLoadMs,
      avgLoadMs, // alias for convenience
      errors:       sumCounts(errorsSeries),
      projectClicks: sumCounts(projectClicksSeries),
    };

    // Charts payload (use hydrated titles)
    const charts = {
      projectClicks: topProjects.map(p => ({
        projectId: p.projectId,
        clicks:    p.clicks,
        title:     p.title,
      })),
      sessionsByDay: sessionsDaily, // [{date,count}]
    };

    res.json({
      range: { start, end, days },
      totals,
      charts,
      series: {
        pageviews,
        projectClicks: projectClicksSeries,
        resumeClicks:  resumeClicksSeries,
        loadTimes,
        errors:        errorsSeries,
        sessionsDaily,
      },
      topProjects, // [{ projectId, title, clicks }]
    });
  } catch (e) {
    console.error("[analytics] getAnalytics failed", e);
    res.status(500).json({ error: "getAnalytics failed" });
  }
};

// Compatibility: router may call getAnalyticsSummary
exports.getAnalyticsSummary = exports.getAnalytics;

/* ───────────────────────── Maintenance ─────────────────────── */

// Zeroed payload helper for immediate UI snap after reset
function emptyPayload(range = 7, tzOffset = 0) {
  const today = new Date();
  const days = [];
  for (let i = range - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setUTCDate(today.getUTCDate() - i);
    const t = new Date(d.getTime() + tzOffset * 60_000);
    const y = t.getUTCFullYear();
    const m = String(t.getUTCMonth() + 1).padStart(2, "0");
    const day = String(t.getUTCDate()).padStart(2, "0");
    days.push(`${y}-${m}-${day}`);
  }
  return {
    range,
    pageviews: 0,
    resumeClicks: 0,
    sessions: 0,
    series: days.map((d) => ({ day: d, pageviews: 0, resume_click: 0 })),
  };
}

exports.resetAnalytics = async (_req, res) => {
  try {
    const supa = await getAdminClient();

    // Try RPC (preferred if you deployed it)
    const rpc = await supa.rpc("admin_reset_analytics");
    if (!rpc.error) {
      return res.json(emptyPayload(7, 0));
    }
    console.warn("[analytics] RPC admin_reset_analytics missing or failed:", rpc.error?.message);

    // Fallback: delete all rows from analytics_events
    // Use a condition that always matches rows without requiring a specific PK
    const { error: delErr } = await supa
      .from("analytics_events")
      .delete()
      .neq("event_type", "__nonexistent__");
    if (delErr) throw delErr;

    return res.json(emptyPayload(7, 0));
  } catch (e) {
    console.error("[analytics reset crash]", e);
    return res
      .status(500)
      .json({ error: "server_crash", detail: e.message || String(e) });
  }
};

/* ───────────────────────── Debug (admin-only route) ────────────────── */
// Debug: what does the server (this env) see in the last N days?
exports.debugEventTypes = async (req, res) => {
  try {
    const days = Number(req.query.days || 7);
    const { start, end } = (function rangeFromDays(d = 7) {
      const end   = new Date();
      const start = new Date(end);
      start.setUTCDate(end.getUTCDate() - Number(d) + 1);
      return { start, end };
    })(days);

    const supa = await getAdminClient();
    const { data, error } = await supa
      .from("analytics_events")
      .select("event_type, ts")
      .gte("ts", start.toISOString())
      .lte("ts", end.toISOString());

    if (error) throw error;

    const counts = {};
    for (const r of data || []) {
      const t = String(r.event_type || "").trim().toLowerCase();
      counts[t] = (counts[t] || 0) + 1;
    }
    res.json({
      range: { start: start.toISOString(), end: end.toISOString(), days },
      counts,
      hint: "counts are from the SAME DB/env your Admin API uses",
    });
  } catch (e) {
    console.error("[analytics] debugEventTypes failed", e);
    res.status(500).json({ error: "debugEventTypes failed", detail: String(e?.message || e) });
  }
};
