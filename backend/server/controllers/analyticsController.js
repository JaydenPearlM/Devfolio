// do not delete
// backend/server/controllers/analyticsController.js

import crypto from "crypto";
import { getAdminClient } from "../utils/supabase.js";

const ANALYTICS_EVENTS = {
  PAGEVIEW: "pageview",
  PROJECT_IMPRESSION: "project_impression",
  PROJECT_CLICK: "project_click",
  RESUME_CLICK: "resume_click",
  CTA_CLICK: "cta_click",
  LOAD_TIME: "load_time",
  CLIENT_ERROR: "client_error",
  SESSION_END: "session_end",
};

const ANALYTICS_TABLE_CANDIDATES = ["analytics_events", "analytics"];

function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n));
}

function iso(value) {
  return new Date(value).toISOString();
}

function normalizePath(value) {
  if (!value) return "/";

  try {
    const s = String(value);

    if (s.startsWith("http://") || s.startsWith("https://")) {
      return new URL(s).pathname || "/";
    }

    return s.startsWith("/") ? s : `/${s}`;
  } catch {
    return "/";
  }
}

function ipFrom(req) {
  return (req.headers["x-forwarded-for"] || req.ip || "")
    .toString()
    .split(",")[0]
    .trim() || null;
}

function hashSession(ip, ua) {
  const raw = `${ip || ""}|${ua || ""}`;
  return crypto.createHash("sha1").update(raw).digest("hex").slice(0, 16);
}

function getMetaName(meta) {
  if (!meta || typeof meta !== "object") return "";
  return String(meta.name || "").trim().toLowerCase();
}

function rangeFromDays(days = 30) {
  const safeDays = clamp(Number(days || 30), 1, 365);
  const end = new Date();
  const start = new Date(end);
  start.setUTCDate(end.getUTCDate() - safeDays + 1);
  return { start, end };
}

function logSupabaseError(label, error, payload = null) {
  console.error(`[analytics] ${label}`, {
    message: error?.message || String(error),
    details: error?.details || null,
    hint: error?.hint || null,
    code: error?.code || null,
    payload,
  });
}

function pickFirst(row, keys, fallback = null) {
  for (const key of keys) {
    if (row && row[key] !== undefined && row[key] !== null) {
      return row[key];
    }
  }
  return fallback;
}

function normalizeEventRow(row = {}) {
  const eventType = String(
    pickFirst(row, ["event_type", "type", "eventType"], "")
  )
    .trim()
    .toLowerCase();

  const ts = pickFirst(row, ["ts", "created_at", "createdAt"], null);
  const loadMsRaw = pickFirst(
    row,
    ["load_ms", "loadMs", "duration_ms", "durationMs"],
    null
  );
  const projectId = pickFirst(row, ["project_id", "projectId"], null);
  const sessionId = pickFirst(row, ["session_id", "sessionId"], null);
  const meta = pickFirst(row, ["meta", "metadata", "payload"], null);

  return {
    ...row,
    event_type: eventType,
    ts,
    path: normalizePath(pickFirst(row, ["path", "pathname"], "/")),
    load_ms: Number.isFinite(Number(loadMsRaw)) ? Number(loadMsRaw) : null,
    project_id: projectId != null ? String(projectId) : null,
    session_id: sessionId != null ? String(sessionId) : null,
    meta: meta && typeof meta === "object" ? meta : null,
  };
}

function extractMissingColumn(error) {
  const text = `${error?.message || ""} ${error?.details || ""} ${error?.hint || ""}`;

  const patterns = [
    /column ["']?([a-zA-Z0-9_]+)["']? does not exist/i,
    /Could not find the ['"]([a-zA-Z0-9_]+)['"] column/i,
    /schema cache.*column ['"]([a-zA-Z0-9_]+)['"]/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      return match[1];
    }
  }

  return null;
}

async function getAnalyticsTable(supa) {
  for (const table of ANALYTICS_TABLE_CANDIDATES) {
    const { error } = await supa.from(table).select("*").limit(1);
    if (!error) {
      return table;
    }
  }

  return ANALYTICS_TABLE_CANDIDATES[0];
}

async function fetchProjectTitles(supa, ids = []) {
  const uniq = [...new Set((ids || []).filter(Boolean).map(String))];
  if (!uniq.length) return new Map();

  const numericIds = uniq
    .map((x) => Number(x))
    .filter((n) => Number.isFinite(n));

  if (!numericIds.length) return new Map();

  const { data, error } = await supa
    .from("Devfolio")
    .select("id, title")
    .in("id", numericIds);

  if (error) {
    logSupabaseError("fetchProjectTitles failed", error);
    return new Map();
  }

  const map = new Map();

  for (const row of data || []) {
    map.set(String(row.id), row.title || `Project ${row.id}`);
  }

  return map;
}

async function adaptiveInsert(supa, table, payload) {
  let nextPayload = { ...payload };

  for (let i = 0; i < 8; i += 1) {
    const { error } = await supa.from(table).insert(nextPayload);

    if (!error) {
      return { ok: true };
    }

    const missingColumn = extractMissingColumn(error);

    if (missingColumn && missingColumn in nextPayload) {
      logSupabaseError(
        `adaptiveInsert stripping missing column "${missingColumn}"`,
        error,
        nextPayload
      );
      delete nextPayload[missingColumn];
      continue;
    }

    throw error;
  }

  throw new Error("adaptiveInsert failed after multiple retries");
}

async function insertEvent(req, event_type, fields = {}) {
  const supa = getAdminClient();
  const table = await getAnalyticsTable(supa);

  const ip = ipFrom(req);
  const user_agent = req.get("user-agent") || null;
  const referrer = req.get("referer") || null;

  const session_id =
    fields.session_id ??
    req.body?.session_id ??
    req.body?.sessionId ??
    hashSession(ip, user_agent);

  const project_id =
    fields.projectId ??
    req.body?.project_id ??
    req.body?.projectId ??
    null;

  const meta = fields.meta ?? req.body?.meta ?? null;

  const load_ms =
    fields.ms != null
      ? Number(fields.ms)
      : req.body?.ms != null
        ? Number(req.body.ms)
        : req.body?.loadMs != null
          ? Number(req.body.loadMs)
          : req.body?.load_ms != null
            ? Number(req.body.load_ms)
            : null;

  const payload = {
    event_type,
    ts: new Date().toISOString(),
    path: normalizePath(
      fields.path ?? req.body?.path ?? req.query?.path ?? referrer ?? "/"
    ),
    project_id,
    load_ms: Number.isFinite(load_ms) ? load_ms : null,
    referrer,
    user_agent,
    ip,
    session_id,
    meta,
  };

  try {
    await adaptiveInsert(supa, table, payload);
    return { ok: true };
  } catch (error) {
    logSupabaseError(`insertEvent failed for ${event_type}`, error, payload);
    throw error;
  }
}

export async function recordPageview(req, res) {
  try {
    await insertEvent(req, ANALYTICS_EVENTS.PAGEVIEW, {
      path: req.body?.path,
    });

    res.status(204).end();
  } catch (e) {
    console.error("[analytics] recordPageview", e);
    res.status(500).json({ error: "recordPageview failed" });
  }
}

export async function recordLoadTime(req, res) {
  try {
    const ms = req.body?.ms ?? req.body?.loadMs ?? req.body?.load_ms ?? 0;

    await insertEvent(req, ANALYTICS_EVENTS.LOAD_TIME, {
      ms: Number(ms),
      path: req.body?.path,
    });

    res.status(204).end();
  } catch (e) {
    console.error("[analytics] recordLoadTime", e);
    res.status(500).json({ error: "recordLoadTime failed" });
  }
}

export async function recordProjectImpression(req, res) {
  try {
    const projectId = req.body?.projectId ?? req.body?.project_id ?? null;

    await insertEvent(req, ANALYTICS_EVENTS.PROJECT_IMPRESSION, {
      projectId,
      path: req.body?.path,
      meta: {
        source: req.body?.source ?? req.body?.meta?.source ?? "project-card",
        action:
          req.body?.action ?? req.body?.meta?.action ?? "project_impression",
        ...(req.body?.meta && typeof req.body.meta === "object"
          ? req.body.meta
          : {}),
      },
    });

    res.status(204).end();
  } catch (e) {
    console.error("[analytics] recordProjectImpression", e);
    res.status(500).json({ error: "recordProjectImpression failed" });
  }
}

export async function recordProjectClick(req, res) {
  try {
    const projectId = req.body?.projectId ?? req.body?.project_id ?? null;

    await insertEvent(req, ANALYTICS_EVENTS.PROJECT_CLICK, {
      projectId,
      path: req.body?.path,
      meta: {
        source: req.body?.source ?? req.body?.meta?.source ?? "project-card",
        action: req.body?.action ?? req.body?.meta?.action ?? "project_click",
        destination:
          req.body?.destination ?? req.body?.meta?.destination ?? null,
        href: req.body?.href ?? req.body?.meta?.href ?? null,
        ...(req.body?.meta && typeof req.body.meta === "object"
          ? req.body.meta
          : {}),
      },
    });

    res.status(204).end();
  } catch (e) {
    console.error("[analytics] recordProjectClick", e);
    res.status(500).json({ error: "recordProjectClick failed" });
  }
}

export async function recordResumeClick(req, res) {
  try {
    const meta = {
      source: req.body?.source ?? req.body?.meta?.source ?? null,
      action: req.body?.action ?? req.body?.meta?.action ?? null,
      resume_url: req.body?.resume_url ?? req.body?.meta?.resume_url ?? null,
      name: ANALYTICS_EVENTS.RESUME_CLICK,
    };

    await insertEvent(req, ANALYTICS_EVENTS.RESUME_CLICK, {
      path: req.body?.path,
      meta,
    });

    res.status(204).end();
  } catch (e) {
    console.error("[analytics] recordResumeClick", e);
    res.status(500).json({ error: "recordResumeClick failed" });
  }
}

export async function recordClientError(req, res) {
  try {
    await insertEvent(req, ANALYTICS_EVENTS.CLIENT_ERROR, {
      path: req.body?.path,
      meta: {
        message: req.body?.msg ?? req.body?.meta?.message ?? "client_error",
        ...(req.body?.meta && typeof req.body.meta === "object"
          ? req.body.meta
          : {}),
      },
    });

    res.status(204).end();
  } catch (e) {
    console.error("[analytics] recordClientError", e);
    res.status(500).json({ error: "recordClientError failed" });
  }
}

export async function recordSessionEnd(req, res) {
  try {
    await insertEvent(req, ANALYTICS_EVENTS.SESSION_END, {
      path: req.body?.path,
      meta: {
        reason: req.body?.reason ?? null,
        duration_ms:
          req.body?.duration_ms != null ? Number(req.body.duration_ms) : null,
      },
    });

    res.status(204).end();
  } catch (e) {
    console.error("[analytics] recordSessionEnd", e);
    res.status(500).json({ error: "session_end_failed" });
  }
}

export async function recordCtaClick(req, res) {
  try {
    const meta = {
      ...(req.body?.meta && typeof req.body.meta === "object"
        ? req.body.meta
        : {}),
      name: String(
        req.body?.meta?.name ?? req.body?.name ?? ANALYTICS_EVENTS.CTA_CLICK
      )
        .trim()
        .toLowerCase(),
      source: req.body?.meta?.source ?? req.body?.source ?? null,
      href: req.body?.meta?.href ?? req.body?.href ?? null,
    };

    await insertEvent(req, ANALYTICS_EVENTS.CTA_CLICK, {
      path: req.body?.path,
      meta,
    });

    res.status(204).end();
  } catch (e) {
    console.error("[analytics] recordCtaClick", {
      code: e?.code || null,
      details: e?.details || null,
      hint: e?.hint || null,
      message: e?.message || String(e),
    });
    res.status(500).json({ error: "recordCtaClick failed" });
  }
}

export async function ping(_req, res) {
  try {
    const supa = getAdminClient();
    const table = await getAnalyticsTable(supa);

    const { error } = await supa.from(table).select("*").limit(1);
    if (error) throw error;

    res.json({
      ok: true,
      at: new Date().toISOString(),
      table,
      db: "connected",
    });
  } catch (e) {
    console.error("[analytics] ping failed", e);
    res.status(500).json({
      ok: false,
      error: e?.message || "analytics ping failed",
    });
  }
}

export async function getAnalytics(req, res) {
  try {
    const { start, end } = rangeFromDays(Number(req.query.range || 30));
    const supa = getAdminClient();
    const table = await getAnalyticsTable(supa);

    const { data, error } = await supa
      .from(table)
      .select("*")
      .gte("ts", start.toISOString())
      .lte("ts", end.toISOString())
      .order("ts", { ascending: false });

    if (error) {
      const fallback = await supa
        .from(table)
        .select("*")
        .gte("created_at", start.toISOString())
        .lte("created_at", end.toISOString())
        .order("created_at", { ascending: false });

      if (fallback.error) throw fallback.error;

      res.json({
        rangeDays: clamp(Number(req.query.range || 30), 1, 365),
        events: (fallback.data || []).map(normalizeEventRow),
      });
      return;
    }

    res.json({
      rangeDays: clamp(Number(req.query.range || 30), 1, 365),
      events: (data || []).map(normalizeEventRow),
    });
  } catch (e) {
    console.error("[analytics] getAnalytics failed", e);
    res.status(500).json({ error: "getAnalytics failed" });
  }
}

export async function publicSummary(req, res) {
  try {
    const days = clamp(parseInt(req.query.range || "7", 10) || 7, 1, 365);
    const since = new Date(Date.now() - days * 86400000);

    const supa = getAdminClient();
    const table = await getAnalyticsTable(supa);

    let rows = [];
    let error = null;

    {
      const result = await supa
        .from(table)
        .select("*")
        .gte("ts", iso(since))
        .order("ts", { ascending: false });

      if (!result.error) {
        rows = (result.data || []).map(normalizeEventRow);
      } else {
        error = result.error;
      }
    }

    if (error) {
      const fallback = await supa
        .from(table)
        .select("*")
        .gte("created_at", iso(since))
        .order("created_at", { ascending: false });

      if (fallback.error) throw fallback.error;

      rows = (fallback.data || []).map(normalizeEventRow);
    }

    let pageviews = 0;
    let resumeClicks = 0;
    let clientErrors = 0;
    let sessionEnds = 0;
    let totalLoadMs = 0;
    let loadCount = 0;

    let pricingPageViews = 0;
    let pricingContactClicks = 0;
    let linkedinClicks = 0;
    let githubClicks = 0;

    const sessions = new Set();
    const projectCounts = new Map();
    const projectImpressions = new Map();

    for (const row of rows) {
      const type = String(row.event_type || "").trim().toLowerCase();
      const projectId = row.project_id ? String(row.project_id) : null;

      if (row.session_id) {
        sessions.add(String(row.session_id));
      }

      if (type === ANALYTICS_EVENTS.PAGEVIEW) pageviews += 1;
      if (type === ANALYTICS_EVENTS.RESUME_CLICK) resumeClicks += 1;
      if (type === ANALYTICS_EVENTS.CLIENT_ERROR) clientErrors += 1;
      if (type === ANALYTICS_EVENTS.SESSION_END) sessionEnds += 1;

      if (type === ANALYTICS_EVENTS.LOAD_TIME && Number.isFinite(row.load_ms)) {
        totalLoadMs += Number(row.load_ms);
        loadCount += 1;
      }

      if (type === ANALYTICS_EVENTS.PROJECT_IMPRESSION && projectId) {
        projectImpressions.set(
          projectId,
          (projectImpressions.get(projectId) || 0) + 1
        );
      }

      if (type === ANALYTICS_EVENTS.PROJECT_CLICK && projectId) {
        projectCounts.set(projectId, (projectCounts.get(projectId) || 0) + 1);
      }

      if (type === ANALYTICS_EVENTS.CTA_CLICK) {
        const metaName = getMetaName(row.meta);

        if (metaName === "pricing_page_view") pricingPageViews += 1;
        if (metaName === "pricing_contact_click") pricingContactClicks += 1;
        if (metaName === "linkedin_click") linkedinClicks += 1;
        if (metaName === "github_click") githubClicks += 1;
      }
    }

    const topProjectsRaw = [...projectCounts.entries()]
      .map(([projectId, count]) => ({ projectId, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const allProjectIds = [
      ...new Set([...projectImpressions.keys(), ...projectCounts.keys()]),
    ];

    const topConvertingProjectsRaw = allProjectIds
      .map((projectId) => {
        const impressions = projectImpressions.get(projectId) || 0;
        const clicks = projectCounts.get(projectId) || 0;
        const ctr = impressions > 0 ? clicks / impressions : 0;

        return {
          projectId,
          impressions,
          clicks,
          ctr,
        };
      })
      .filter((project) => project.impressions >= 1)
      .sort((a, b) => {
        if (b.ctr !== a.ctr) return b.ctr - a.ctr;
        if (b.clicks !== a.clicks) return b.clicks - a.clicks;
        return b.impressions - a.impressions;
      })
      .slice(0, 5);

    const titleMap = await fetchProjectTitles(supa, [
      ...topProjectsRaw.map((p) => p.projectId),
      ...topConvertingProjectsRaw.map((p) => p.projectId),
    ]);

    const topProjects = topProjectsRaw.map((p) => ({
      projectId: p.projectId,
      clicks: p.count,
      title: titleMap.get(String(p.projectId)) || `Project ${p.projectId}`,
    }));

    const topConvertingProjects = topConvertingProjectsRaw.map((p) => ({
      projectId: p.projectId,
      title: titleMap.get(String(p.projectId)) || `Project ${p.projectId}`,
      impressions: p.impressions,
      clicks: p.clicks,
      ctr: Number((p.ctr * 100).toFixed(1)),
    }));

    const recentEvents = rows.slice(0, 20);

    res.json({
      rangeDays: days,
      totals: {
        pageviews,
        resumeClicks,
        sessions: sessions.size,
        clientErrors,
        sessionEnds,
        avgLoadMs: loadCount ? Math.round(totalLoadMs / loadCount) : 0,
      },
      ctaMetrics: {
        pricingPageViews,
        pricingContactClicks,
        linkedinClicks,
        githubClicks,
      },
      topProjects,
      topConvertingProjects,
      recentEvents,
      events: recentEvents,
      daily: [],
    });
  } catch (e) {
    console.error("[analytics] publicSummary failed", e);
    res.status(500).json({ error: "publicSummary failed" });
  }
}

export async function resetAnalytics(_req, res) {
  try {
    const supa = getAdminClient();
    const table = await getAnalyticsTable(supa);

    const { error } = await supa
      .from(table)
      .delete()
      .neq("event_type", "__none__");

    if (error) {
      const fallback = await supa.from(table).delete().neq("type", "__none__");
      if (fallback.error) throw fallback.error;
    }

    res.json({ ok: true });
  } catch (e) {
    console.error("[analytics] resetAnalytics failed", e);
    res.status(500).json({ error: "server_crash" });
  }
}