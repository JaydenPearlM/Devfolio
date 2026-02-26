// src/api_analytics/analytics.js
// Fire-and-forget analytics beacons with sendBeacon fallback to fetch.
// Matches server/controllers/analyticsController.js field names.

function postJSON(url, payload) {
  try {
    const body = JSON.stringify(payload);
    const blob = new Blob([body], { type: "application/json" });
    if (navigator.sendBeacon && navigator.sendBeacon(url, blob)) return;
  } catch {}
  try {
    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      keepalive: true,
      body: JSON.stringify(payload),
    }).catch(() => {});
  } catch {}
}

export function recordPageview(path = window.location.pathname) {
  // Server reads: event_type via route, and `path`
  postJSON("/api/analytics/pageview", {
    path,
  });
}

export function recordLoadTime(path = window.location.pathname, ms = 0) {
  const n = Math.round(ms || 0);
  // Server accepts either `ms` or `load_ms`; send both for maximum compatibility
  postJSON("/api/analytics/load-time", {
    path,
    ms: n,
    load_ms: n,
  });
}

export function recordProjectClick(projectId) {
  // Server expects `projectId` (or project_id) — send camelCase
  postJSON("/api/analytics/project-click", {
    projectId: String(projectId ?? ""),
  });
}

export function recordResumeClick(label = "resume") {
  // Server expects resume type in meta via `resumeType` (or `label`)
  postJSON("/api/analytics/resumeClicks", {
    path: window.location.pathname,
    resumeType: String(label || "resume"),
  });
}

export function recordClientError(message, meta = {}) {
  // Server expects `msg` and optional `meta`
  postJSON("/api/analytics/client-error", {
    msg: String(message || "client_error"),
    meta: meta && typeof meta === "object" ? meta : {},
  });
}

// Optional: call this when unloading a page or explicitly ending a session
export function recordSessionEnd(reason = null, durationMs = null, path = window.location.pathname) {
  postJSON("/api/analytics/session-end", {
    path,
    reason,
    duration_ms: durationMs == null ? null : Math.round(Number(durationMs)),
  });
}
