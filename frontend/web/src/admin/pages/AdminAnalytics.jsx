import React, { useEffect, useMemo, useState } from "react";
import "./AdminAnalytics.css";

import {
  getPublicAnalyticsSummary,
  resetAnalyticsData,
} from "../../lib/analytics";

function formatEventType(type = "") {
  const map = {
    pageview: "Pageview",
    "load-time": "Load Time",
    load_time: "Load Time",
    "project-impression": "Project Impression",
    project_impression: "Project Impression",
    "project-click": "Project Click",
    project_click: "Project Click",
    "resume-click": "Resume Click",
    resume_click: "Resume Click",
    "cta-click": "CTA Click",
    cta_click: "CTA Click",
    "client-error": "Client Error",
    client_error: "Client Error",
    "session-end": "Session End",
    session_end: "Session End",
  };

  return (
    map[type] ||
    String(type || "Event")
      .replace(/[-_]/g, " ")
      .replace(/\b\w/g, (m) => m.toUpperCase())
  );
}

function formatEventTime(value) {
  if (!value) return "Unknown time";

  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "Unknown time";

  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getMetricTone(key) {
  switch (key) {
    case "pageviews":
      return "analytics-card--blue";
    case "resumeClicks":
      return "analytics-card--gold";
    case "sessions":
      return "analytics-card--violet";
    case "clientErrors":
      return "analytics-card--red";
    case "sessionEnds":
      return "analytics-card--cyan";
    case "avgLoadMs":
      return "analytics-card--green";
    default:
      return "analytics-card--blue";
  }
}

function safeJson(value) {
  try {
    return JSON.stringify(value ?? {}, null, 2);
  } catch {
    return "{}";
  }
}

function BusinessClicksPanel({ summary }) {
  const ctaMetrics = summary?.ctaMetrics || {};

  const rows = [
    {
      label: "Pricing Page Views",
      helper: "How often people visit the pricing page",
      value: Number(ctaMetrics.pricingPageViews ?? 0),
    },
    {
      label: "Pricing Contact Clicks",
      helper: "How many people clicked to contact you for a website",
      value: Number(ctaMetrics.pricingContactClicks ?? 0),
    },
    {
      label: "LinkedIn Clicks",
      helper: "Visitors clicking out to your LinkedIn",
      value: Number(ctaMetrics.linkedinClicks ?? 0),
    },
    {
      label: "GitHub Clicks",
      helper: "Visitors opening your GitHub profile or repos",
      value: Number(ctaMetrics.githubClicks ?? 0),
    },
  ];

  return (
    <div className="analyticsChartCard">
      <div className="analyticsChartHeader">
        <div className="analyticsChartEyebrow">Professional Hub</div>
        <h3 className="analyticsChartTitle">Connections</h3>
      </div>

      <div className="analyticsBusinessList">
        {rows.map((row) => (
          <div key={row.label} className="analyticsBusinessRow">
            <div className="analyticsBusinessCard">
              <div className="analyticsBusinessCardMain">
                <div className="analyticsBusinessCardTitle">{row.label}</div>
                <div className="analyticsBusinessCardHelper">{row.helper}</div>
              </div>

              <div className="analyticsBusinessCardValue">{row.value}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProjectClicksPanel({ projects = [] }) {
  if (!projects.length) {
    return <div className="analyticsEmptyState">No project clicks yet.</div>;
  }

  const maxClicks = Math.max(1, ...projects.map((p) => Number(p.clicks ?? 0)));

  return (
    <div className="analyticsProjectList">
      {projects.map((project, index) => {
        const safeClicks = Number(project.clicks ?? 0);
        const width = `${Math.max(
          12,
          Math.round((safeClicks / maxClicks) * 100)
        )}%`;

        return (
          <div
            key={project.projectId || project.project_id || index}
            className="analyticsProjectRow"
          >
            <div className="analyticsProjectRank">{index + 1}</div>

            <div className="analyticsProjectBody">
              <div className="analyticsProjectTop">
                <div className="analyticsProjectTitle">
                  {project.title ||
                    `Project ${project.projectId || project.project_id || "—"}`}
                </div>

                <div className="analyticsProjectClicks">{safeClicks} clicks</div>
              </div>

              <div className="analyticsProjectMeta">
                Project ID: {project.projectId || project.project_id || "—"}
              </div>

              <div className="analyticsProjectBarTrack">
                <div className="analyticsProjectBarFill" style={{ width }} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TopConvertingPanel({ projects = [] }) {
  if (!projects.length) {
    return (
      <div className="analyticsEmptyState">
        No project conversion data yet.
      </div>
    );
  }

  const maxCtr = Math.max(1, ...projects.map((p) => Number(p.ctr ?? 0)));

  return (
    <div className="analyticsProjectList">
      {projects.map((project, index) => {
        const safeCtr = Number(project.ctr ?? 0);
        const safeClicks = Number(project.clicks ?? 0);
        const safeImpressions = Number(project.impressions ?? 0);

        const width = `${Math.max(
          12,
          Math.round((safeCtr / maxCtr) * 100)
        )}%`;

        return (
          <div
            key={project.projectId || project.project_id || index}
            className="analyticsProjectRow"
          >
            <div className="analyticsProjectRank">{index + 1}</div>

            <div className="analyticsProjectBody">
              <div className="analyticsProjectTop">
                <div className="analyticsProjectTitle">
                  {project.title ||
                    `Project ${project.projectId || project.project_id || "—"}`}
                </div>

                <div className="analyticsProjectClicks">{safeCtr}% CTR</div>
              </div>

              <div className="analyticsProjectMeta">
                {safeClicks} clicks • {safeImpressions} impressions
              </div>

              <div className="analyticsProjectBarTrack">
                <div className="analyticsProjectBarFill" style={{ width }} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function EventModal({ event, onClose }) {
  if (!event) return null;

  return (
    <div className="analytics-modalOverlay" onClick={onClose}>
      <div className="analytics-modal" onClick={(e) => e.stopPropagation()}>
        <div className="analytics-modalHeader">
          <div>
            <div className="analytics-modalEyebrow">Event Details</div>
            <h2 className="analytics-modalTitle">
              {formatEventType(event.event_type)}
            </h2>
          </div>

          <button
            type="button"
            className="analytics-modalClose"
            onClick={onClose}
          >
            Close
          </button>
        </div>

        <div className="analytics-modalGrid">
          <div className="analytics-detailCard">
            <span className="analytics-detailLabel">Path</span>
            <div className="analytics-detailValue">{event.path || "/"}</div>
          </div>

          <div className="analytics-detailCard">
            <span className="analytics-detailLabel">Time</span>
            <div className="analytics-detailValue">
              {formatEventTime(event.ts || event.created_at)}
            </div>
          </div>

          <div className="analytics-detailCard">
            <span className="analytics-detailLabel">Event Type</span>
            <div className="analytics-detailValue">
              {formatEventType(event.event_type)}
            </div>
          </div>

          <div className="analytics-detailCard">
            <span className="analytics-detailLabel">Load Time</span>
            <div className="analytics-detailValue">
              {typeof event.load_ms === "number"
                ? `${event.load_ms}ms`
                : "No load metric"}
            </div>
          </div>

          <div className="analytics-detailCard">
            <span className="analytics-detailLabel">Project ID</span>
            <div className="analytics-detailValue">
              {event.project_id || "—"}
            </div>
          </div>

          <div className="analytics-detailCard">
            <span className="analytics-detailLabel">Session ID</span>
            <div className="analytics-detailValue analytics-detailValue--mono">
              {event.session_id || "—"}
            </div>
          </div>
        </div>

        <div className="analytics-metaPanel">
          <div className="analytics-metaHeader">Raw Metadata</div>
          <pre className="analytics-metaPre">{safeJson(event.meta || event)}</pre>
        </div>
      </div>
    </div>
  );
}

export default function AdminAnalytics() {
  const [status, setStatus] = useState("Loading…");
  const [summary, setSummary] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isResetting, setIsResetting] = useState(false);

  async function loadSummary() {
    try {
      setStatus("Loading…");
      const json = await getPublicAnalyticsSummary(7);
      setSummary(json);
      setStatus("");
    } catch (e) {
      setStatus(e?.message || "Failed to load analytics");
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        const json = await getPublicAnalyticsSummary(7);

        if (!cancelled) {
          setSummary(json);
          setStatus("");
        }
      } catch (e) {
        if (!cancelled) {
          setStatus(e?.message || "Failed to load analytics");
        }
      }
    }

    run();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleResetAnalytics() {
    const ok = window.confirm(
      "Reset all analytics data? This will delete the current analytics events."
    );

    if (!ok) return;

    try {
      setIsResetting(true);
      setStatus("");
      await resetAnalyticsData();
      await loadSummary();
    } catch (e) {
      setStatus(e?.message || "Failed to reset analytics");
    } finally {
      setIsResetting(false);
    }
  }

  const totals = summary?.totals || {};
  const topProjects = Array.isArray(summary?.topProjects)
    ? summary.topProjects
    : [];
  const topConvertingProjects = Array.isArray(summary?.topConvertingProjects)
    ? summary.topConvertingProjects
    : [];
  const recentEvents = Array.isArray(summary?.recentEvents)
    ? summary.recentEvents
    : Array.isArray(summary?.events)
      ? summary.events
      : [];

  const visibleEvents = useMemo(() => recentEvents, [recentEvents]);

  const metricCards = [
    {
      key: "pageviews",
      label: "Pageviews",
      value: totals.pageviews ?? 0,
      helper: "Traffic across the current range",
    },
    {
      key: "resumeClicks",
      label: "Resume Clicks",
      value: totals.resumeClicks ?? 0,
      helper: "Hiring funnel interest",
    },
    {
      key: "sessions",
      label: "Sessions",
      value: totals.sessions ?? 0,
      helper: "Tracked browsing sessions",
    },
    {
      key: "clientErrors",
      label: "Client Errors",
      value: totals.clientErrors ?? 0,
      helper: "Frontend issues seen by users",
    },
    {
      key: "sessionEnds",
      label: "Session Ends",
      value: totals.sessionEnds ?? 0,
      helper: "Tracked exit signals",
    },
    {
      key: "avgLoadMs",
      label: "Average Load Time",
      value: `${totals.avgLoadMs ?? 0}ms`,
      helper: "Average page load speed",
    },
  ];

  return (
    <>
      <div className="analyticsPage">
        {status && status !== "Loading…" ? (
          <div className="analyticsStatus analyticsStatus--error">{status}</div>
        ) : null}

        <section className="analyticsMetricGrid">
          {metricCards.map((card) => (
            <article
              key={card.key}
              className={`analyticsCard ${getMetricTone(card.key)}`}
            >
              <div className="analyticsCardLabel">{card.label}</div>
              <div className="analyticsCardValue">{card.value}</div>
              <div className="analyticsCardHelper">{card.helper}</div>
            </article>
          ))}
        </section>

        <section className="analyticsDashboardThreeCol">
          <div className="analyticsDashboardCol analyticsDashboardCol--left">
            <div className="analyticsPanel analyticsPanel--projects">
              <div className="analyticsPanelHeader">
                <div>
                  <div className="analyticsPanelEyebrow">Click Activity</div>
                  <h2 className="analyticsPanelTitle">Top Project Clicks</h2>
                </div>
              </div>

              <ProjectClicksPanel projects={topProjects} />
              <BusinessClicksPanel summary={summary} />
            </div>
          </div>

          <div className="analyticsDashboardCol analyticsDashboardCol--middle">
            <div className="analyticsPanel analyticsPanel--projects">
              <div className="analyticsPanelHeader">
                <div>
                  <div className="analyticsPanelEyebrow">Conversion</div>
                  <h2 className="analyticsPanelTitle">Top Converting Projects</h2>
                </div>
              </div>

              <TopConvertingPanel projects={topConvertingProjects} />
            </div>
          </div>

          <div className="analyticsDashboardCol analyticsDashboardCol--right">
            <div className="analyticsPanel analyticsPanel--events">
              <div className="analyticsPanelHeader">
                <div>
                  <div className="analyticsPanelEyebrow">Live Feed</div>
                  <h2 className="analyticsPanelTitle">Recent Events</h2>
                </div>

                <button
                  type="button"
                  className="analyticsEventResetButton"
                  onClick={handleResetAnalytics}
                  disabled={isResetting}
                >
                  {isResetting ? "Resetting..." : "Reset Analytics"}
                </button>
              </div>

              {visibleEvents.length ? (
                <div className="analyticsEventList analyticsEventList--scroll analyticsEventList--blueScroll">
                  {visibleEvents.map((event, idx) => (
                    <button
                      key={`${event.ts || event.created_at || idx}-${idx}`}
                      type="button"
                      className="analyticsEventButton"
                      onClick={() => setSelectedEvent(event)}
                    >
                      <div className="analyticsEventTop">
                        <span className="analyticsEventType">
                          {formatEventType(event.event_type)}
                        </span>

                        <span className="analyticsEventTime">
                          {formatEventTime(event.ts || event.created_at)}
                        </span>
                      </div>

                      <div className="analyticsEventPath">{event.path || "/"}</div>

                      <div className="analyticsEventBottom">
                        <span>
                          {typeof event.load_ms === "number"
                            ? `Load ${event.load_ms}ms`
                            : "No load metric"}
                        </span>

                        <span className="analyticsEventInspect">
                          View details →
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="analyticsEmptyState">No recent events yet.</div>
              )}
            </div>
          </div>
        </section>
      </div>

      <EventModal
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
      />
    </>
  );
}