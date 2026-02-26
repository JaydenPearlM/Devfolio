// devfolio-client/src/pages/AdminAnalytics.jsx
import React, { useEffect, useMemo, useState } from "react";
import api, { apiPost } from "../lib/api";              // axios instance (adds Authorization)
import { ChartLine, ChartBar } from "../components/ChartLine";
import CountUp from "../components/CountUp";
import { getAdminToken } from "../lib/auth";            // debug only

const RANGES = [7, 30, 90];
const VIEWS = ["Daily", "Weekly", "Monthly", "Yearly"];

/* ────────────────────────── Helpers ────────────────────────── */
function sumSeries(arr) {
  if (!Array.isArray(arr) || !arr.length) return 0;
  return arr.reduce((a, b) => a + Number(b?.count ?? b?.value ?? 0), 0);
}
function firstDefined(...vals) {
  for (const v of vals) {
    if (v !== undefined && v !== null && !Number.isNaN(v)) return v;
  }
  return undefined;
}

/** Normalize totals to the shape the UI expects */
function normalizeTotals(raw) {
  const r = raw?.data ?? raw ?? {};
  const t = r.totals ?? r.summary ?? {};

  const pageviews     = Number(firstDefined(t.pageviews, r.pageviews, sumSeries(r?.series?.pageviews)) ?? 0);
  const sessions      = Number(firstDefined(t.sessions, r.sessions) ?? 0);

  // Prefer totals.* if present; otherwise fall back to series/charts (single-sum)
  const resumeClicksTotals = Number(
    firstDefined(
      t.resumeClicks,
      r.resumeClicks,
      r?.totals?.resumeClicks,
      t.resume_clicks,
      r.resume_clicks,
      r?.totals?.resume_clicks,
      r.resumes,
      r?.totals?.resumes,
      0
    )
  );

  const avgLoadMs     = Number(firstDefined(t.avgLoadTimeMs, t.avgLoadMs, r.avgLoadTime, r.load_ms_avg, 0) ?? 0);
  const errors        = Number(firstDefined(t.errors, r.errorCount, r.errors, 0) ?? 0);
  const projectClicks = Number(firstDefined(t.projectClicks, r.projectClicks, 0) ?? 0);

  return { pageviews, sessions, resumeClicks: resumeClicksTotals, avgLoadMs, errors, projectClicks };
}

/** Normalize series for Sessions + (single) ResumeClicks */
function normalizeSeries(raw) {
  const r = raw?.data ?? raw ?? {};

  // SessionsByDay shortcut if server already formats it for charts
  const sessionsByDay = r?.charts?.sessionsByDay;
  if (Array.isArray(sessionsByDay)) {
    return sessionsByDay.map(d => ({ date: d.date, sessions: Number(d.count ?? 0) }));
  }

  // General object-of-series shape → map into day rows
  const daily = r?.series?.daily ?? r?.daily ?? r?.series ?? [];
  if (!Array.isArray(daily) && typeof daily === "object" && daily !== null) {
    const map = new Map();
    const push = (key, arr, valKey = "count") => {
      (arr || []).forEach((d) => {
        const date = d.date || d.day || d.ts || d.bucket || d.d;
        if (!date) return;
        const prev = map.get(date) || { date };
        prev[key] = Number(d[valKey] ?? d.count ?? d.value ?? 0);
        map.set(date, prev);
      });
    };

    // Sessions + Pageviews
    push("pageviews", r?.series?.pageviews || r?.pageviewsPerDay);
    push("sessions",  r?.series?.sessions  || r?.sessionsPerDay);

    // 🔒 Normalize resume clicks ONCE (choose first available series)
    const resumeClicksSeries = r?.series?.resumeClicks ?? [];
    push("resumeClicks", Array.isArray(resumeClicksSeries) ? resumeClicksSeries : []);

    // Avg load if present
    push("avgLoadMs", r?.series?.avgLoadMs, "avgLoadMs");

    return Array.from(map.values()).sort((a, b) => String(a.date).localeCompare(String(b.date)));
  }

  // Already in array-of-day-rows shape
  return (daily || []).map((d) => ({
    date: d?.date || d?.day || d?.ts || d?.bucket || "",
    pageviews: Number(d?.pageviews ?? d?.pv ?? d?.count ?? 0),
    sessions: Number(d?.sessions ?? d?.sess ?? 0),
    resumeClicks: Number(
      d?.resumeClicks ??
      d?.resume_clicks ??
      d?.rc ??
      d?.resumes ??
      0
    ),
    avgLoadMs: Number(d?.avgLoadMs ?? d?.ms ?? d?.load_ms_avg ?? 0),
  }));
}

/** Normalize top projects */
function normalizeTopProjects(raw) {
  const r = raw?.data ?? raw ?? {};
  const clicksArr = r?.charts?.projectClicks || r.topProjects || r.projectsTop || [];
  const hydrateMap = new Map(
    (r.topProjects || []).map((p) => [String(p.projectId), p.title])
  );

  return clicksArr.map((p) => {
    const idStr = String(p?.projectId ?? p?.project_id ?? "");
    const clicks = Number(p?.clicks ?? p?.count ?? 0);

    const resolvedTitle =
      p?.title ||
      hydrateMap.get(idStr) ||
      p?.name ||
      p?.projectName ||
      idStr ||
      "Untitled Project";

    return {
      title: String(resolvedTitle),
      clicks,
      projectId: idStr,
    };
  });
}

/** Normalize recent error logs → array of strings */
function normalizeErrors(raw) {
  const r = raw?.data ?? raw ?? {};

  const candidates = [
    r.errors,
    r.errorLogs,
    r.recentErrors,
    r.logs?.errors,
    r?.charts?.errors,
    r?.details?.errors,
    r?.errors?.items,
  ].filter(Boolean);

  let arr = [];
  for (const c of candidates) {
    if (Array.isArray(c)) { arr = c; break; }
  }

  if (!Array.isArray(arr)) return [];

  return arr.map((e) => {
    if (typeof e === "string") return e;
    if (e?.message) return String(e.message);
    if (e?.error) return String(e.error);
    if (e?.msg) return String(e.msg);
    if (e?.description) return String(e.description);
    try { return JSON.stringify(e); } catch { return String(e); }
  }).filter(Boolean);
}

/* ────────────────────────── Grouping helpers ────────────────────────── */
function toDate(d) {
  const t = new Date(d);
  return isNaN(t.getTime()) ? null : t;
}
function keyMonth(dt) {
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}
function keyWeek(dt) {
  const d = new Date(Date.UTC(dt.getFullYear(), dt.getMonth(), dt.getDate()));
  const dayNum = (d.getUTCDay() + 6) % 7 + 1;
  d.setUTCDate(d.getUTCDate() + (4 - dayNum));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}
function groupSeries(series, key, mode) {
  if (!Array.isArray(series)) return [];
  if (mode === "Daily") {
    return series
      .filter((d) => d.date)
      .map((d) => ({ label: String(d.date).slice(0, 10), count: Number(d[key] ?? 0) }));
  }
  const map = new Map();
  for (const d of series) {
    const dt = toDate(d.date);
    if (!dt) continue;
    const bucket =
      mode === "Weekly" ? keyWeek(dt) : mode === "Monthly" ? keyMonth(dt) : String(dt.getFullYear());
    map.set(bucket, (map.get(bucket) || 0) + Number(d[key] ?? 0));
  }
  return Array.from(map.entries())
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .map(([label, count]) => ({ label, count }));
}

/* ────────────────────────── Dropdown ────────────────────────── */
function Dropdown({ open, onClose, children }) {
  if (!open) return null;
  return (
    <div className="relative">
      <div className="fixed inset-0 z-10" onClick={onClose} aria-label="Close menu" />
      <div className="absolute left-0 z-20 mt-2 w-56 rounded-lg border bg-white shadow-lg p-2">
        {children}
      </div>
    </div>
  );
}

/* ────────────────────────── KPI card ────────────────────────── */
function Kpi({ label, value, className = "", loading = false, suffix = "" }) {
  const n = Number.isFinite(Number(value)) ? Number(value) : 0;
  const formatted = new Intl.NumberFormat().format(n);

  return (
    <div className={`rounded-xl p-4 shadow-md ${className}`} style={{ fontFamily: "Inter, sans-serif" }}>
      <div className="text-sm opacity-80">{label}</div>
      <div className="mt-1 text-2xl font-bold min-h-[1.75rem] flex items-baseline gap-2">
        {loading ? "—" : <span>{formatted}{suffix}</span>}
      </div>
    </div>
  );
}

/* ────────────────────────── Errors Card ────────────────────────── */
function ErrorsCard({ errors = [], countFallback = 0, loading = false }) {
  const count = errors.length || Number(countFallback) || 0;
  return (
    <div className="bg-rose-300/70 text-rose-900 rounded-xl p-4 shadow-md relative overflow-hidden">
      <div className="text-sm opacity-80">Errors</div>
      <div className="mt-1 text-2xl font-bold">{loading ? "—" : count}</div>

      <div
        className="mt-3 max-h-48 overflow-y-auto border-t border-rose-400/50 pt-2 pr-2
                   scrollbar-thin scrollbar-thumb-rose-700/40 scrollbar-track-transparent"
        style={{ scrollbarWidth: "thin" }}
      >
        {errors.length ? (
          errors.map((msg, i) => (
            <div
              key={i}
              className="text-sm text-rose-900/90 bg-rose-100/70 rounded-sm mb-1 px-2 py-1 break-words"
              title={msg}
            >
              {msg}
            </div>
          ))
        ) : (
          <div className="text-sm text-rose-900/80">No recent errors</div>
        )}
      </div>
    </div>
  );
}

/* ────────────────────────── Page ────────────────────────── */
export default function AdminAnalytics() {
  const [range, setRange] = useState(7);
  const [view, setView] = useState("Daily");
  const [loading, setLoading] = useState(false);

  // Error shown for load failures
  const [err, setErr] = useState("");

  // Header banner for reset failures (separate from load error)
  const [banner, setBanner] = useState("");

  const [raw, setRaw] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  async function load(r = range) {
    try {
      setLoading(true);
      setErr("");
      const tok = getAdminToken();
      console.log("[admin] load analytics", { range: r, hasToken: !!tok, len: tok?.length || 0 });

      const tzOffset = -new Date().getTimezoneOffset(); // minutes east of UTC
      const res = await api.get("/analytics", { params: { range: r, tzOffset } });
      setRaw(res?.data ?? res);
    } catch (e) {
      setErr(e?.response?.data?.error || e?.message || "Analytics data could not be loaded");
    } finally {
      setLoading(false);
    }
  }

  async function resetAnalytics() {
    const confirmReset = window.confirm("Reset all analytics data to 0? This cannot be undone.");
    if (!confirmReset) return;
    try {
      setLoading(true);
      setErr("");
      const res = await apiPost("/analytics/reset");
      setRaw(res?.data ?? res);     // snap UI to zeros right away
      setRange(7);                  // range effect below will perform a single reload
      // ❌ no direct load(7) here — prevents double GET
    } catch (e) {
      console.error("resetAnalytics failed", e);
      setBanner("⚠️ resetAnalytics failed");
    } finally {
      setLoading(false);
      setMenuOpen(false);
    }
  }

  // Single source of truth: whenever range changes, load once.
  useEffect(() => { if (range) load(range); }, [range]);

  // Auto-dismiss both badges after 10s
  useEffect(() => {
    if (!err) return;
    const t = setTimeout(() => setErr(""), 10000);
    return () => clearTimeout(t);
  }, [err]);

  useEffect(() => {
    if (!banner) return;
    const t = setTimeout(() => setBanner(""), 10000);
    return () => clearTimeout(t);
  }, [banner]);

  const totals = useMemo(() => normalizeTotals(raw), [raw]);
  const seriesMixed = useMemo(() => normalizeSeries(raw), [raw]);
  const topProjectsAll = useMemo(() => normalizeTopProjects(raw), [raw]);
  const errorList = useMemo(() => normalizeErrors(raw), [raw]);

  // If totals.resumeClicks is 0/undefined, use summed normalized series as fallback
  const resumeClicksFromSeries = useMemo(
    () => sumSeries(seriesMixed.map(d => ({ count: d?.resumeClicks ?? 0 }))),
    [seriesMixed]
  );
  const resumeClicksFinal = totals.resumeClicks || resumeClicksFromSeries;

  const top5Projects = useMemo(() => {
    return (topProjectsAll || [])
      .slice()
      .sort((a, b) => (b.clicks || 0) - (a.clicks || 0))
      .slice(0, 5)
      .map((p) => ({ ...p, title: String(p.title || p.projectId || "Untitled Project") }));
  }, [topProjectsAll]);

  const projLabels = top5Projects.map((p) => p.title);
  const projData   = top5Projects.map((p) => p.clicks || 0);

  const groupedSESS = useMemo(() => groupSeries(seriesMixed, "sessions", view), [seriesMixed, view]);
  const sessLabels = groupedSESS.map((d) => d.label);
  const sessData = groupedSESS.map((d) => d.count || 0);

  return (
    <div className="space-y-6" style={{ fontFamily: "Inter, Montserrat, Oswald, sans-serif" }}>
      {/* Header */}
      <div className="flex items-center justify-between gap-3 pr-0">
        {/* Left: menu + title + inline badges */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <button
              aria-label="Analytics menu"
              title="Analytics menu"
              className="inline-flex items-center justify-center h-9 w-9 rounded-lg border hover:bg-gray-50"
              onClick={() => setMenuOpen((s) => !s)}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" />
              </svg>
            </button>

            <Dropdown open={menuOpen} onClose={() => setMenuOpen(false)}>
              <div className="px-2 py-1 text-xs uppercase text-gray-500">Range</div>
              <div className="flex gap-2 p-2">
                {RANGES.map((r) => (
                  <button
                    key={r}
                    onClick={() => { setRange(r); setMenuOpen(false); }}
                    className={`px-2 py-1 rounded border text-sm ${
                      r === range ? "bg-blue-100 text-blue-700 border-blue-300" : "hover:bg-gray-50"
                    }`}
                  >
                    {r}d
                  </button>
                ))}
              </div>

              <div className="px-2 pt-2 text-xs uppercase text-gray-500">View</div>
              <div className="grid grid-cols-2 gap-2 p-2">
                {VIEWS.map((v) => (
                  <button
                    key={v}
                    onClick={() => { setView(v); setMenuOpen(false); }}
                    className={`px-2 py-1 rounded border text-sm text-left ${
                      v === view ? "bg-emerald-100 text-emerald-800 border-emerald-300" : "hover:bg-gray-50"
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>

              <div className="border-t my-2" />
              <div className="p-2 space-y-2">
                <button
                  onClick={() => { setMenuOpen(false); load(range); }} // single GET refresh
                  className="w-full inline-flex items-center justify-center gap-2 rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50"
                >
                  🔄 Refresh Analytics
                </button>
                <button
                  onClick={resetAnalytics}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-md border px-3 py-1.5 text-sm text-red-700 hover:bg-red-50"
                >
                  🧹 Reset Analytics
                </button>
              </div>
            </Dropdown>
          </div>

          <h1
            className="text-3xl font-[Oswald] font-bold text-white tracking-wide"
            style={{ fontFamily: "Oswald, sans-serif" }}
          >
            Analytics
          </h1>

          {/* Inline badges */}
          <div className="flex gap-2 items-center">
            {banner && (
              <div
                role="status"
                aria-live="polite"
                className="text-sm font-medium text-amber-800 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-md shadow-sm"
                title={banner}
              >
                {banner}
              </div>
            )}
            {err && (
              <div
                role="status"
                aria-live="polite"
                className="text-sm font-medium text-red-700 bg-red-50 border border-red-200 px-3 py-1.5 rounded-md shadow-sm"
                title={err}
              >
                ⚠️ {err}
              </div>
            )}
          </div>
        </div>

        {/* Right spacer */}
        <div />
      </div>

      {/* KPI Top Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <Kpi label="Resume Clicks" value={resumeClicksFinal} loading={loading} className="bg-violet-300/80 text-violet-900" />
        <Kpi label="Pageviews"     value={totals.pageviews}    loading={loading} className="bg-sky-300/80 text-sky-900" />
        <Kpi label="Sessions"      value={totals.sessions}     loading={loading} className="bg-emerald-300/80 text-emerald-900" />
      </div>

      {/* Middle Row: Top Projects + Load/Error */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl bg-pink-200/70 p-5 shadow-md">
          <div className="text-base font-medium text-gray-800 mb-3">Top Projects (clicks)</div>
          {loading ? (
            <div className="text-sm text-gray-600">Loading…</div>
          ) : top5Projects?.length ? (
            <ChartBar labels={projLabels} data={projData} title="Project Clicks" />
          ) : (
            <div className="text-gray-700">No project clicks in this range.</div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Kpi label="Avg Load Time" value={totals.avgLoadMs ?? 0} loading={loading} suffix=" ms" className="bg-amber-300/70 text-amber-900" />
          <ErrorsCard errors={errorList} countFallback={totals.errors} loading={loading} />
        </div>
      </div>

      {/* Bottom Row: Sessions Table + Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl bg-violet-200/70 p-5 shadow-md">
          <div className="text-base font-medium text-gray-800 mb-3">Sessions ({view.toLowerCase()})</div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-700 font-semibold border-b border-violet-300">
                  <th className="py-2 pr-3">Bucket</th>
                  <th className="py-2">Sessions</th>
                </tr>
              </thead>
              <tbody>
                {groupedSESS.length ? groupedSESS.map((d, i) => (
                  <tr key={i} className="border-b border-violet-300/60">
                    <td className="py-2 pr-3">{d.label || "—"}</td>
                    <td className="py-2">{d.count ?? "—"}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="2" className="py-3 text-gray-600 text-center">
                      No data yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-xl bg-amber-200/70 p-5 shadow-md">
          <div className="text-base font-medium text-gray-800 mb-3">Sessions Over Time</div>
          {loading ? (
            <div className="text-sm text-gray-600">Loading…</div>
          ) : groupedSESS.length ? (
            <ChartLine labels={sessLabels} data={sessData} title="Sessions" />
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-600">No data yet.</div>
          )}
        </div>
      </div>

      {err && (
        <div className="text-red-600 text-sm px-1">
          Error: {err}
        </div>
      )}
    </div>
  );
}
