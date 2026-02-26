// src/App.js
import React, { useEffect, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";
import PricingPage from "./components/PricingPage";
import { Toaster } from "react-hot-toast";

import Sidebar from "./components/Sidebar";
import Footer from "./components/site_footer";
import TopBanner from "./components/TopBanner";
import GlobalBg from "./components/GlobalBg";

// PUBLIC PAGES
import HomePage from "./components/HomePage";
import LifeHub from "./personal-projects/LifeHub";
import TCCGRetail from "./personal-projects/TcgRetail";

// ADMIN PAGES
import AdminLogin from "./pages/AdminLogin";
import AdminAnalytics from "./pages/AdminAnalytics";
import ManageProjects from "./pages/ManageProjects";

// Auth + Analytics
import { isAuthed, clearAdminToken, RequireAdmin } from "./lib/auth";
import { initAnalyticsBeacons } from "./analytics/beacons";

// Shared analytics helpers
import { recordPageview, recordLoadTime } from "./lib/analytics";

import "./App.css";

/* ───────────────────────────── Helpers ───────────────────────────── */
function renderSafe(Comp, name, props = {}) {
  const t = typeof Comp;
  if (t === "function") return React.createElement(Comp, props);
  console.error(`[renderSafe] ${name} is not a React component`, {
    type: t,
    value: Comp,
  });
  return (
    <div className="p-4 m-2 rounded border border-red-300 bg-red-50 text-red-700">
      <div className="font-semibold mb-1">Component load error</div>
      <div>
        <code>{name}</code> is <code>{t}</code> instead of a function.
      </div>
      <div className="mt-1 text-sm opacity-80">
        Check its export: use{" "}
        <code>export default function {name}()&#123;&#125;</code> and import
        correctly.
      </div>
    </div>
  );
}

/* eslint-disable no-console */
console.log("[imports check]", {
  Sidebar: typeof Sidebar,
  Footer: typeof Footer,
  HomePage: typeof HomePage,
  LifeHub: typeof LifeHub,
  TCCGRetail: typeof TCCGRetail,
  AdminLogin: typeof AdminLogin,
  AdminAnalytics: typeof AdminAnalytics,
  ManageProjects: typeof ManageProjects,
  PricingPage: typeof PricingPage,
});
/* eslint-enable no-console */

// Hidden key combo: Ctrl+Alt+A → admin login
function SecretListener() {
  const nav = useNavigate();
  useEffect(() => {
    const handler = (e) => {
      if (e.ctrlKey && e.altKey && (e.key === "a" || e.key === "A")) {
        nav("/_/login");
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [nav]);
  return null;
}

// Record a pageview ONLY for the public homepage + quick load-time.
function PageviewBeacon() {
  const { pathname } = useLocation();
  const isPublicHomepage =
    pathname === "/" || pathname.toLowerCase() === "/home";
  const pagePathToRecord = "/";

  useEffect(() => {
    if (!isPublicHomepage) return;

    // pageview
    recordPageview(pagePathToRecord);

    // crude load-time
    const t0 = performance.now();
    const raf =
      typeof requestAnimationFrame === "function"
        ? requestAnimationFrame
        : (cb) => setTimeout(cb, 0);
    raf(() => {
      const ms = Math.round(performance.now() - t0);
      recordLoadTime(pagePathToRecord, ms);
    });
  }, [isPublicHomepage, pagePathToRecord, pathname]);

  return null;
}

/* ───────── Admin Overlay (hash === "#") to show Admin Homepage ───────── */
function AdminOverlay() {
  const [hash, setHash] = useState("");
  const [open, setOpen] = useState(false);

  // Keep local state in sync with the current hash
  useEffect(() => {
    const sync = () => setHash(window.location.hash || "");
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  // Open overlay when authed + hash === "#"
  useEffect(() => {
    setOpen(isAuthed() && hash === "#");
  }, [hash]);

  // ESC to close; lock background scroll while open
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape" && open) {
        history.replaceState(
          null,
          "",
          window.location.pathname + window.location.search
        );
        setOpen(false);
      }
    }
    if (open) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", onKey);
    } else {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    }
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm">
      <div className="absolute inset-4 md:inset-8 rounded-xl bg-white shadow-xl overflow-hidden flex flex-col">
        {/* Admin top bar */}
        <div className="flex items-center justify-between px-4 py-2 border-b">
          <div className="font-semibold text-gray-700">Admin</div>
          <div className="flex items-center gap-3">
            <a
              href="/admin/projects"
              className="text-sm underline"
              title="Go to Manage Projects"
            >
              Manage Projects
            </a>
            <button
              className="rounded px-2 py-1 text-sm border hover:bg-gray-50"
              onClick={() => {
                history.replaceState(
                  null,
                  "",
                  window.location.pathname + window.location.search
                );
                setOpen(false);
              }}
              title="Close Admin"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Admin “Homepage” content (analytics dashboard) */}
        <div className="flex-1 overflow-auto p-4">
          {renderSafe(AdminAnalytics, "AdminAnalytics")}
        </div>
      </div>
    </div>
  );
}

/* ───────── Security: strip stray hashes; DO NOT clear token on unload ───────── */
function SecurityBootEnforcer() {
  const { pathname } = useLocation();

  useEffect(() => {
    // If someone lands with '#' but isn't authed, strip it to keep / clean.
    if (!isAuthed() && window.location.hash === "#") {
      history.replaceState(null, "", pathname + window.location.search);
    }
    // ⚠️ DO NOT clear the admin token on beforeunload.
    // Refresh triggers beforeunload, which was forcing a logout on reload.
  }, [pathname]);

  return null;
}

/* ───────── Hide/Show TopBanner based on route ───────── */
function TopBannerGate() {
  const { pathname } = useLocation();
  // Hide on any /admin/* route and on the special admin overlay (#) to keep visuals clean
  const hideForAdminOverlay = isAuthed() && window.location.hash === "#";

  const hide =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/_/") ||      // hides on /_/login too
    pathname === "/pricing" ||         // 🔹 hide banner on pricing page
    hideForAdminOverlay;

  if (hide) return null;
  return <TopBanner />;
}

/* ───────── Apply correct top padding depending on banner presence ───────── */
function LayoutBody({ children }) {
  const { pathname } = useLocation();
  const hideForAdminOverlay = isAuthed() && window.location.hash === "#";
  const bannerHidden =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/_/") ||
    pathname === "/pricing" ||         // 🔹 keep padding in sync with TopBannerGate
    hideForAdminOverlay;

  // If banner is showing, offset content (old pt-24). If hidden, use compact padding.
  const padClass = bannerHidden ? "pt-4" : "pt-24";

  return <div className={`flex-1 min-h-screen p-4 ${padClass}`}>{children}</div>;
}

/* ───────────────────────────── App ───────────────────────────── */
export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <BrowserRouter>
      {/* Global fixed background behind everything */}
      <GlobalBg />

      {/* Full-bleed fixed top banner (conditionally rendered) */}
      <TopBannerGate />

      <SecurityBootEnforcer />
      <SecretListener />
      <PageviewBeacon />
      <Toaster position="top-right" reverseOrder={false} />

      {/* Admin overlay listens to location.hash === "#" */}
      <AdminOverlay />

      <div className="flex">
        {renderSafe(Sidebar, "Sidebar", {
          isOpen: sidebarOpen,
          onClose: () => setSidebarOpen(!sidebarOpen),
        })}

        <LayoutBody>
          <Routes>
            {/* ───── PUBLIC ROUTES ───── */}
            <Route path="/" element={renderSafe(HomePage, "HomePage")} />
            <Route path="/home" element={renderSafe(HomePage, "HomePage")} />
            <Route path="/LifeHub" element={renderSafe(LifeHub, "LifeHub")} />
            <Route
              path="/TCGRetail"
              element={renderSafe(TCCGRetail, "TCCGRetail")}
            />

            {/* ⭐ Pricing / Services route */}
            <Route
              path="/pricing"
              element={renderSafe(PricingPage, "PricingPage")}
            />

            <Route
              path="/_/login"
              element={renderSafe(AdminLogin, "AdminLogin")}
            />

            {/* ───── ADMIN ROUTES (Protected deep pages) ───── */}
            <Route
              path="/admin/projects"
              element={
                <RequireAdmin>
                  {renderSafe(ManageProjects, "ManageProjects")}
                </RequireAdmin>
              }
            />
            <Route
              path="/admin/analytics"
              element={
                <RequireAdmin>
                  {renderSafe(AdminAnalytics, "AdminAnalytics")}
                </RequireAdmin>
              }
            />

            {/* Back-compat: /admin → /admin/analytics */}
            <Route
              path="/admin"
              element={<Navigate to="/admin/analytics" replace />}
            />

            {/* Catch-all → public home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </LayoutBody>

        {renderSafe(Footer, "Footer")}
      </div>
    </BrowserRouter>
  );
}
