// src/analytics/beacons.js
import {
  recordLoadTime,
  recordSessionEnd,
  recordClientError,
  recordResumeClick,
} from "../../lib/analytics";

// Hard singleton so HMR / StrictMode can't double-register.
if (!window.__devfolioAnalytics) {
  window.__devfolioAnalytics = {
    installed: false,
    resumeLastByUrl: new Map(), // url -> ts
    resumeLastAnyTs: 0,
    sessionStart: Date.now(),
    errorCount: 0,
  };
}

const RESUME_DEDUPE_MS = 3000; // generous window to swallow duplicates
const MAX_ERROR_REPORTS = 3;

// global hard lock + per-URL dedupe
function fireResumeOnce(resumeUrl, meta) {
  const now = Date.now();

  // Hard lock: swallow anything within window, regardless of source
  if (now - window.__devfolioAnalytics.resumeLastAnyTs < RESUME_DEDUPE_MS) return;
  window.__devfolioAnalytics.resumeLastAnyTs = now;

  const url = String(resumeUrl || "");
  const lastForUrl = window.__devfolioAnalytics.resumeLastByUrl.get(url) || 0;
  if (now - lastForUrl < RESUME_DEDUPE_MS) return;
  window.__devfolioAnalytics.resumeLastByUrl.set(url, now);

  recordResumeClick({
    source: "marked",
    action: meta?.action || "click",
    resume_url: url || null,
    path: window.location?.pathname || "/",
    button: meta?.button ?? 0,
    metaKey: !!meta?.metaKey,
    ctrlKey: !!meta?.ctrlKey,
    shiftKey: !!meta?.shiftKey,
    altKey: !!meta?.altKey,
  });
}

export function initAnalyticsBeacons() {
  if (window.__devfolioAnalytics.installed) return;
  window.__devfolioAnalytics.installed = true;

  // --- page load performance (first load only) ---
  const sendLoad = () => {
    try {
      const nav = performance.getEntriesByType?.("navigation")?.[0];
      const loadMs = nav ? Math.round(nav.duration) : Math.round(performance.now());
      recordLoadTime(window.location?.pathname || "/", loadMs);
    } catch {
      // ignore analytics failures
    }
  };

  if (document.readyState === "complete") {
    setTimeout(sendLoad, 0);
  } else {
    window.addEventListener("load", () => setTimeout(sendLoad, 0), { once: true });
  }

  // --- session duration ---
  const sendSessionEnd = () => {
    const durationMs = Math.max(0, Date.now() - window.__devfolioAnalytics.sessionStart);
    recordSessionEnd(
      "page_hidden",
      durationMs,
      window.location?.pathname || "/"
    );
  };

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      sendSessionEnd();
    }
  });

  window.addEventListener("pagehide", sendSessionEnd);

  // --- client errors (rate-limited) ---
  const sendError = (message, meta = {}) => {
    if (window.__devfolioAnalytics.errorCount >= MAX_ERROR_REPORTS) return;
    window.__devfolioAnalytics.errorCount += 1;
    recordClientError(message, meta);
  };

  window.addEventListener("error", (e) => {
    const name = e.error?.name || "Error";
    const message = e.message || String(e.error || "Unknown error");
    const stack = e.error?.stack ? String(e.error.stack).slice(0, 1000) : null;

    sendError(message, {
      name,
      stack,
      source: "window.error",
    });
  });

  window.addEventListener("unhandledrejection", (e) => {
    const reason = e.reason;
    const name = reason?.name || "UnhandledRejection";
    const message = reason?.message || String(reason);
    const stack = reason?.stack ? String(reason.stack).slice(0, 1000) : null;

    sendError(message, {
      name,
      stack,
      source: "window.unhandledrejection",
    });
  });

  // --- Résumé clicks (global, deduped) ---
  const handleAnchor = (e, type) => {
    const anchor = e.target?.closest?.("a");
    if (!anchor) return;

    // EXPLICIT-ONLY: only track anchors marked with data-resume-link
    const isResume = anchor.hasAttribute("data-resume-link");
    if (!isResume) return;

    // Filter: only left button for click and only middle button for auxclick
    if (type === "click" && (e.button ?? 0) !== 0) return;
    if (type === "auxclick" && (e.button ?? 0) !== 1) return;

    // Extra per-element guard
    if (anchor.dataset._resumeBeaconed === "1") return;
    anchor.dataset._resumeBeaconed = "1";

    queueMicrotask(() => {
      delete anchor.dataset._resumeBeaconed;
    });

    const href = anchor.getAttribute("href") || "";

    fireResumeOnce(href, {
      action: type,
      button: e.button ?? 0,
      metaKey: !!e.metaKey,
      ctrlKey: !!e.ctrlKey,
      shiftKey: !!e.shiftKey,
      altKey: !!e.altKey,
    });
  };

  // Left-click and middle/aux clicks
  document.addEventListener("click", (e) => handleAnchor(e, "click"), {
    capture: true,
  });

  document.addEventListener("auxclick", (e) => handleAnchor(e, "auxclick"), {
    capture: true,
  });
}