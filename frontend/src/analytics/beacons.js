// src/analytics/beacons.js

// Hard singleton so HMR / StrictMode can't double-register.
if (!window.__devfolioAnalytics) {
  window.__devfolioAnalytics = {
    installed: false,
    resumeLastByUrl: new Map(), // url -> ts
    resumeLastAnyTs: 0,
  };
}

const RESUME_DEDUPE_MS = 3000; // generous window to swallow duplicates

function postJSON(url, payload, useBeacon = false) {
  const pathname = window.location?.pathname;
  const body = JSON.stringify({ ...payload, path: pathname });

  if (useBeacon && navigator.sendBeacon) {
    try {
      const blob = new Blob([body], { type: 'application/json' });
      navigator.sendBeacon(url, blob);
      return Promise.resolve(true);
    } catch (_) {}
  }

  return fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    keepalive: useBeacon,
    body,
  }).catch(() => {});
}

// global hard lock + per-URL dedupe
function fireResumeOnce(resumeUrl, meta) {
  const now = Date.now();
  // Hard lock: swallow anything within window, regardless of source
  if (now - window.__devfolioAnalytics.resumeLastAnyTs < RESUME_DEDUPE_MS) return;
  window.__devfolioAnalytics.resumeLastAnyTs = now;

  const u = String(resumeUrl || '');
  const lastForUrl = window.__devfolioAnalytics.resumeLastByUrl.get(u) || 0;
  if (now - lastForUrl < RESUME_DEDUPE_MS) return;
  window.__devfolioAnalytics.resumeLastByUrl.set(u, now);

  postJSON(
    '/api/analytics/resume-click',
    { event_type: 'resume_click', meta: { resume_url: u || null, ...meta } },
    true // beacon so nav/new tab won't cancel
  );
}

export function initAnalyticsBeacons() {
  if (window.__devfolioAnalytics.installed) return;
  window.__devfolioAnalytics.installed = true;

  // --- page load performance (first load only) ---
  const sendLoad = () => {
    try {
      const nav = performance.getEntriesByType?.('navigation')?.[0];
      const loadMs = nav ? Math.round(nav.duration) : Math.round(performance.now());
      postJSON('/api/analytics/load-time', { loadMs });
    } catch (_) {}
  };
  if (document.readyState === 'complete') {
    setTimeout(sendLoad, 0);
  } else {
    window.addEventListener('load', () => setTimeout(sendLoad, 0), { once: true });
  }

  // --- session duration ---
  const sessionStart = Date.now();
  const sendSessionEnd = () => {
    const sec = Math.max(0, Math.round((Date.now() - sessionStart) / 1000));
    postJSON('/api/analytics/session-end', { sessionSec: sec }, true);
  };
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') sendSessionEnd();
  });
  window.addEventListener('pagehide', sendSessionEnd);

  // --- client errors (rate-limited) ---
  let errorCount = 0;
  const sendError = (payload) => {
    if (errorCount >= 3) return;
    errorCount += 1;
    postJSON('/api/analytics/client-error', payload, true);
  };
  window.addEventListener('error', (e) => {
    const name = e.error?.name || 'Error';
    const message = e.message || String(e.error || 'Unknown error');
    const stack = e.error?.stack ? String(e.error.stack).slice(0, 1000) : null;
    sendError({ name, message, stack });
  });
  window.addEventListener('unhandledrejection', (e) => {
    const reason = e.reason;
    const name = (reason && reason.name) || 'UnhandledRejection';
    const message = reason?.message || String(reason);
    const stack = reason?.stack ? String(reason.stack).slice(0, 1000) : null;
    sendError({ name, message, stack });
  });

  // --- Résumé clicks (global, deduped) ---
  const handleAnchor = (e, type) => {
    const a = e.target?.closest?.('a');
    if (!a) return;

    // ✅ EXPLICIT-ONLY: only track anchors marked with data-resume-link
    const isResume = a.hasAttribute('data-resume-link');
    if (!isResume) return;

    // Filter: only left button for 'click' and only middle button for 'auxclick'
    if (type === 'click' && (e.button ?? 0) !== 0) return;
    if (type === 'auxclick' && (e.button ?? 0) !== 1) return;

    // Extra per-element guard (paranoid, but cheap):
    if (a.dataset._resumeBeaconed === '1') return;
    a.dataset._resumeBeaconed = '1';
    queueMicrotask(() => {
      delete a.dataset._resumeBeaconed;
    });

    const href = a.getAttribute('href') || '';

    fireResumeOnce(href, {
      source: 'marked',
      action: type,
      button: e.button ?? 0,
      metaKey: !!e.metaKey,
      ctrlKey: !!e.ctrlKey,
      shiftKey: !!e.shiftKey,
      altKey: !!e.altKey,
    });
  };

  // Left-click and middle/aux clicks (capture ensures we run before component handlers)
  document.addEventListener('click',    (e) => handleAnchor(e, 'click'),    { capture: true });
  document.addEventListener('auxclick', (e) => handleAnchor(e, 'auxclick'), { capture: true });
}
