import React, { useEffect, useMemo, useState } from "react";
import {
  Routes,
  Route,
  useLocation,
  useNavigate,
  Navigate,
} from "react-router-dom";

import Sidebar from "./component/Sidebar";
import PricingPage from "./component/PricingPage";

import HomePage from "./homepage/HomePage";
import DeltaPetsAlphaPage from "./Pages/deltaPetsAlphaPage";
import AdminLogin from "./admin/pages/AdminLogin";
import AdminAnalytics from "./admin/pages/AdminAnalytics";
import ManageProjects from "./admin/pages/ManageProjects";

import { RequireAdmin } from "./lib/auth.jsx";
import { recordClientError, recordSessionEnd } from "./lib/analytics";

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const onKeyDown = (e) => {
      const key = (e.key || "").toLowerCase();

      const el = document.activeElement;
      const isTyping =
        el &&
        (el.tagName === "INPUT" ||
          el.tagName === "TEXTAREA" ||
          el.isContentEditable);

      if (isTyping) return;

      if (e.ctrlKey && e.altKey && key === "a") {
        e.preventDefault();
        navigate("/admin");
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [navigate]);

  useEffect(() => {
    const sessionStart = Date.now();

    function isAnalyticsRequestMessage(message = "") {
      const text = String(message || "").toLowerCase();
      return (
        text.includes("/api/analytics") ||
        text.includes("analytics/client-error") ||
        text.includes("analytics/session-end") ||
        text.includes("failed to fetch") ||
        text.includes("http 500")
      );
    }

    function handleClientError(event) {
      try {
        const message =
          event?.message || event?.error?.message || "Unhandled error";

        if (isAnalyticsRequestMessage(message)) return;

        recordClientError({
          path: window.location.pathname,
          meta: {
            source: "window.error",
            message,
            filename: event?.filename || null,
            lineno: event?.lineno || null,
            colno: event?.colno || null,
          },
        }).catch(() => {});
      } catch {
        // ignore
      }
    }

    function handleUnhandledRejection(event) {
      try {
        const reason = event?.reason;
        const message =
          typeof reason === "string"
            ? reason
            : reason?.message || "Unhandled promise rejection";

        if (isAnalyticsRequestMessage(message)) return;

        recordClientError({
          path: window.location.pathname,
          meta: {
            source: "window.unhandledrejection",
            message,
          },
        }).catch(() => {});
      } catch {
        // ignore
      }
    }

    function handleSessionEnd(reason = "pagehide") {
      try {
        const durationMs = Date.now() - sessionStart;

        recordSessionEnd({
          path: window.location.pathname,
          reason,
          duration_ms: durationMs,
        }).catch(() => {});
      } catch {
        // ignore
      }
    }

    function onPageHide() {
      handleSessionEnd("pagehide");
    }

    function onBeforeUnload() {
      handleSessionEnd("beforeunload");
    }

    window.addEventListener("error", handleClientError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);
    window.addEventListener("pagehide", onPageHide);
    window.addEventListener("beforeunload", onBeforeUnload);

    return () => {
      window.removeEventListener("error", handleClientError);
      window.removeEventListener(
        "unhandledrejection",
        handleUnhandledRejection
      );
      window.removeEventListener("pagehide", onPageHide);
      window.removeEventListener("beforeunload", onBeforeUnload);
    };
  }, []);

  const headerTitle = useMemo(() => {
    if (location.pathname === "/deltapets")
      return "Coming Soon! Closed Alpha on June 14th 2026!";
    if (location.pathname === "/pricing") return "Pricing";
    if (location.pathname === "/admin") return "Website Analytics";
    if (location.pathname === "/admin/projects") return "Manage Projects";
    if (location.pathname === "/admin/login") return "Admin Login";
    return "";
  }, [location.pathname]);

  return (
    <div className="app-shell">
      <header className="site-header">
        {headerTitle ? (
          <div
            className="site-header__title"
            style={
              location.pathname === "/deltapets"
                ? {
                    width: "100%",
                    textAlign: "center",
                    transform: "translateX(120px)",
                  }
                : undefined
            }
          >
            {headerTitle}
          </div>
        ) : null}
      </header>

      <div className="app-body">
        <Sidebar
          isOpen={sidebarOpen}
          onOpen={() => setSidebarOpen(true)}
          onClose={() => setSidebarOpen(false)}
        />

        <main className="app-main">
          <div className="content-wrapper">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/deltapets" element={<DeltaPetsAlphaPage />} />
              <Route path="/pricing" element={<PricingPage />} />
              <Route path="/admin/login" element={<AdminLogin />} />

              <Route
                path="/admin"
                element={
                  <RequireAdmin>
                    <AdminAnalytics />
                  </RequireAdmin>
                }
              />

              <Route
                path="/admin/projects"
                element={
                  <RequireAdmin>
                    <ManageProjects />
                  </RequireAdmin>
                }
              />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </main>
      </div>

      <footer className="site-footer">
        <div className="site-footer__inner">
          © {new Date().getFullYear()} Jayden Maxwell
        </div>
      </footer>
    </div>
  );
}