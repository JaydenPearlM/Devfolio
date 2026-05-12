import config from "./config";

const BASE = config?.api?.analyticsBaseUrl || "/api/analytics";

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function cleanPayload(payload = {}) {
  if (!isObject(payload)) return {};

  const out = {};

  for (const [key, value] of Object.entries(payload)) {
    if (value === undefined) continue;
    out[key] = value;
  }

  return out;
}

function normalizeArgs(firstArg, secondArg, kind = "generic") {
  if (isObject(firstArg)) {
    return cleanPayload(firstArg);
  }

  if (kind === "path-ms") {
    return cleanPayload({
      path: firstArg,
      ms: secondArg,
    });
  }

  if (kind === "path-only") {
    return cleanPayload({
      path: firstArg,
    });
  }

  if (kind === "project-click") {
    return cleanPayload({
      projectId: firstArg,
      meta: isObject(secondArg) ? secondArg : undefined,
    });
  }

  if (kind === "project-impression") {
    return cleanPayload({
      projectId: firstArg,
      meta: isObject(secondArg) ? secondArg : undefined,
    });
  }

  if (kind === "resume-click") {
    return cleanPayload({
      path: firstArg,
      meta: isObject(secondArg) ? secondArg : undefined,
    });
  }

  if (kind === "cta-click") {
    if (typeof firstArg === "string") {
      return cleanPayload({
        name: firstArg,
        ...(isObject(secondArg) ? secondArg : {}),
      });
    }

    return {};
  }

  if (kind === "session-end") {
    return cleanPayload({
      path: firstArg,
      ...(isObject(secondArg) ? secondArg : {}),
    });
  }

  return {};
}

async function postJson(path, payload = {}, options = {}) {
  const { throwOnError = false } = options;

  try {
    const res = await fetch(`${BASE}${path}`, {
      method: "POST",
      credentials: "include",
      keepalive: true,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(cleanPayload(payload)),
    });

    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      const error = new Error(json?.error || `HTTP ${res.status}`);

      if (throwOnError) {
        throw error;
      }

      if (import.meta.env.DEV && path !== "/client-error") {
        console.warn(`[analytics] POST ${path} failed:`, error.message);
      }

      return { ok: false, error: error.message };
    }

    return { ok: true, ...json };
  } catch (error) {
    if (throwOnError) {
      throw error;
    }

    if (import.meta.env.DEV && path !== "/client-error") {
      console.warn(
        `[analytics] POST ${path} failed:`,
        error?.message || "Request failed"
      );
    }

    return {
      ok: false,
      error: error?.message || "Request failed",
    };
  }
}

async function getJson(path) {
  const res = await fetch(`${BASE}${path}`, {
    method: "GET",
    credentials: "include",
    headers: {
      Accept: "application/json",
    },
  });

  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(json?.error || `HTTP ${res.status}`);
  }

  return json;
}

async function recordPageview(payloadOrPath = {}) {
  const payload = normalizeArgs(payloadOrPath, undefined, "path-only");
  return postJson("/pageview", isObject(payloadOrPath) ? payloadOrPath : payload);
}

async function recordLoadTime(payloadOrPath = {}, ms) {
  const payload = normalizeArgs(payloadOrPath, ms, "path-ms");
  return postJson("/load-time", isObject(payloadOrPath) ? payloadOrPath : payload);
}

async function recordProjectImpression(payloadOrProjectId = {}, meta) {
  const payload = normalizeArgs(
    payloadOrProjectId,
    meta,
    "project-impression"
  );

  return postJson(
    "/project-impression",
    isObject(payloadOrProjectId) ? payloadOrProjectId : payload
  );
}

async function recordProjectClick(payloadOrProjectId = {}, meta) {
  const payload = normalizeArgs(payloadOrProjectId, meta, "project-click");

  return postJson(
    "/project-click",
    isObject(payloadOrProjectId) ? payloadOrProjectId : payload
  );
}

async function recordResumeClick(payloadOrPath = {}, meta) {
  const payload = normalizeArgs(payloadOrPath, meta, "resume-click");

  return postJson(
    "/resume-click",
    isObject(payloadOrPath) ? payloadOrPath : payload
  );
}

async function recordClientError(payload = {}) {
  return postJson("/client-error", payload);
}

async function recordSessionEnd(payloadOrPath = {}, meta) {
  const payload = normalizeArgs(payloadOrPath, meta, "session-end");

  return postJson(
    "/session-end",
    isObject(payloadOrPath) ? payloadOrPath : payload
  );
}

async function recordCtaClick(payloadOrName = {}, meta) {
  const payload = normalizeArgs(payloadOrName, meta, "cta-click");

  return postJson("/cta-click", isObject(payloadOrName) ? payloadOrName : payload);
}

async function recordPricingPageView(payload = {}) {
  return postJson("/cta-click", {
    path: "/pricing",
    name: "pricing_page_view",
    source: "pricing-page",
    ...payload,
  });
}

async function recordPricingContactClick(payload = {}) {
  return postJson("/cta-click", {
    name: "pricing_contact_click",
    source: "pricing-page",
    ...payload,
  });
}

async function recordLinkedInClick(payload = {}) {
  return postJson("/cta-click", {
    name: "linkedin_click",
    source: "sidebar",
    ...payload,
  });
}

async function recordGitHubClick(payload = {}) {
  return postJson("/cta-click", {
    name: "github_click",
    source: "sidebar",
    ...payload,
  });
}

async function getPublicAnalyticsSummary(days = 7) {
  return getJson(`/public?range=${encodeURIComponent(days)}`);
}

async function getRawAnalytics(days = 7) {
  return getJson(`/?range=${encodeURIComponent(days)}`);
}

async function resetAnalyticsData() {
  const res = await fetch(`${BASE}/reset`, {
    method: "POST",
    credentials: "include",
    headers: {
      Accept: "application/json",
    },
  });

  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(json?.error || `HTTP ${res.status}`);
  }

  return json;
}

const analyticsApi = {
  recordPageview,
  recordLoadTime,
  recordProjectImpression,
  recordProjectClick,
  recordResumeClick,
  recordClientError,
  recordSessionEnd,
  recordCtaClick,
  recordPricingPageView,
  recordPricingContactClick,
  recordLinkedInClick,
  recordGitHubClick,
  getPublicAnalyticsSummary,
  getRawAnalytics,
  resetAnalyticsData,
};

if (typeof window !== "undefined") {
  window.analytics = analyticsApi;
}

export {
  recordPageview,
  recordLoadTime,
  recordProjectImpression,
  recordProjectClick,
  recordResumeClick,
  recordClientError,
  recordSessionEnd,
  recordCtaClick,
  recordPricingPageView,
  recordPricingContactClick,
  recordLinkedInClick,
  recordGitHubClick,
  getPublicAnalyticsSummary,
  getRawAnalytics,
  resetAnalyticsData,
};

export default analyticsApi;