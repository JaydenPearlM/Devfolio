// src/lib/analytics.js
// Same-origin analytics helpers. No CORS. Robust logging + gentle de-dupe.

const BASE = "/api/analytics";

/* ─────────────────────────────────────────────────────────────
   Session id (persists across tabs until cleared)
───────────────────────────────────────────────────────────── */
function getSessionId() {
  try {
    const key = "AN_SESSION_ID";
    let id = localStorage.getItem(key);
    if (!id) {
      id = Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem(key, id);
    }
    return id;
  } catch {
    return "anon";
  }
}

/* ─────────────────────────────────────────────────────────────
   Tiny throttle to prevent floods from double-renders/clicks
───────────────────────────────────────────────────────────── */
const lastSentAt = new Map(); // key -> timestamp
function shouldSend(key, minMs = 600) {
  const now = Date.now();
  const last = lastSentAt.get(key) || 0;
  if (now - last < minMs) return false;
  lastSentAt.set(key, now);
  return true;
}

/* ─────────────────────────────────────────────────────────────
   Core POST
───────────────────────────────────────────────────────────── */
async function postJSON(path, body) {
  try {
    const res = await fetch(`${BASE}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      keepalive: true,
      body: JSON.stringify({
        session_id: getSessionId(),
        user_agent: typeof navigator !== "undefined" ? navigator.userAgent : "",
        referrer: typeof document !== "undefined" ? document.referrer : "",
        ...body,
      }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.warn(`[analytics] ${path} → ${res.status}`, text);
      return null;
    }
    // most endpoints return 204; tolerate empty body
    return await res.json().catch(() => ({}));
  } catch (e) {
    console.warn(`[analytics] ${path} network error`, e);
    return null;
  }
}

/* ─────────────────────────────────────────────────────────────
   Public API
───────────────────────────────────────────────────────────── */
export function recordPageview(pathname = "/") {
  const path = (pathname || "/").toLowerCase() === "/home" ? "/" : pathname || "/";
  const key = `pv:${path}`;
  if (!shouldSend(key)) return;
  void postJSON("/pageview", { event_type: "pageview", path });
}

export function recordLoadTime(pathname = "/", ms = 0) {
  const path = (pathname || "/").toLowerCase() === "/home" ? "/" : pathname || "/";
  const key = `lt:${path}`;
  if (!shouldSend(key)) return;
  void postJSON("/load-time", {
    event_type: "load_time",
    path,
    load_ms: Math.max(0, Math.round(Number(ms) || 0)),
  });
}

export function recordProjectClick(projectId = "", meta = {}) {
  if (!projectId) return;
  const key = `pc:${projectId}`;
  if (!shouldSend(key)) return;
  void postJSON("/project-click", {
    event_type: "project_click",
    project_id: String(projectId),
    meta,
  });
}

/**
 * Résumé clicks — accepts either:
 *  - string source: recordResumeClick("sidebar")
 *  - object payload: recordResumeClick({ source:"sidebar", action:"click", resume_url:"/assets/resume.pdf", path:"/" })
 *
 * Always sends: { event_type:"resume_click", path, meta:{ source, action, resume_url } }
 *
 * NOTE: Prefer NOT calling this from components if you’re using the global beacon.
 * If you do call it, do NOT also mark the link with data-resume-link.
 */
export function recordResumeClick(arg = "link") {
  const source = typeof arg === "string" ? arg : (arg?.source || "unknown");
  const key = `rc:${source}`;
  if (!shouldSend(key, 300)) return;

  const path =
    (typeof arg === "object" && arg?.path) ||
    (typeof window !== "undefined" ? window.location.pathname : "/") ||
    "/";

  const meta =
    typeof arg === "object"
      ? {
          source: arg.source || "unknown",
          action: arg.action || "click",
          resume_url: arg.resume_url || arg.url || null,
        }
      : { source: String(arg || "link"), action: "click", resume_url: null };

  void postJSON("/resume-click", {
    event_type: "resume_click",
    path,
    meta,
  });
}

export function recordClientError(message, meta = {}) {
  void postJSON("/client-error", {
    event_type: "client_error",
    path: typeof window !== "undefined" ? window.location.pathname : "/",
    meta: { message, ...meta },
  });
}

// Debug helpers in console
if (typeof window !== "undefined") {
  window.analytics = {
    recordPageview,
    recordLoadTime,
    recordProjectClick,
    recordResumeClick,
    recordClientError,
  };
}
