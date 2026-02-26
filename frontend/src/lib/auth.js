// devfolio-client/src/lib/auth.js
// Router-agnostic admin auth + clean redirects (BrowserRouter or HashRouter)

import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const KEY_NEW = "ADMIN_AUTH";    // current key
const KEY_OLD = "ADMIN_TOKEN";   // legacy (read-only)

const PUBLIC_HOME = "/";
const LOGIN_PATH  = "/_/login";
const ADMIN_HOME  = "/admin/analytics";

/* ───────────────── storage helpers ───────────────── */
function migrateOldKey() {
  try {
    const hasNew = localStorage.getItem(KEY_NEW);
    const oldVal = localStorage.getItem(KEY_OLD);
    if (!hasNew && oldVal) localStorage.setItem(KEY_NEW, oldVal);
  } catch {}
}

export function getAdminToken() {
  try {
    migrateOldKey();
    const tok = localStorage.getItem(KEY_NEW) || localStorage.getItem(KEY_OLD);
    return tok && String(tok).trim() ? String(tok) : null;
  } catch {
    return null;
  }
}

export function isAuthed() {
  return !!getAdminToken();
}

export function setAdminToken(token) {
  if (!token || !String(token).trim()) {
    clearAdminToken();
    return;
  }
  localStorage.setItem(KEY_NEW, String(token).trim());
  try { window.dispatchEvent(new Event("authChange")); } catch {}
}

export function clearAdminToken() {
  try {
    localStorage.removeItem(KEY_NEW);
    localStorage.removeItem(KEY_OLD);
  } finally {
    try { window.dispatchEvent(new Event("authChange")); } catch {}
  }
}

/* ───────────────── nav helpers ───────────────── */
function isHashMode() {
  try { return window.location.hash.startsWith("#/"); } catch { return false; }
}

function goTo(url, { replace = true } = {}) {
  try {
    if (isHashMode()) {
      const base = window.location.href.split("#")[0];
      const dest = `${base}#${url.startsWith("/") ? "" : "/"}${url}`;
      return replace ? window.location.replace(dest) : (window.location.href = dest);
    }
    return replace ? window.location.replace(url) : (window.location.href = url);
  } catch {
    // last-ditch
    try { window.location.assign(url); } catch {}
  }
}

export function goToPublicHome(opts) { goTo(PUBLIC_HOME, opts); }
export function goToLogin(opts)      { goTo(LOGIN_PATH,  opts); }
export function goToAdminHome(opts)  { goTo(ADMIN_HOME,  opts); }

/* Convenience for login UIs */
export function loginWithToken(token, nextPath) {
  setAdminToken(token);
  if (nextPath && typeof nextPath === "string") {
    goTo(nextPath);
  } else {
    goToAdminHome();
  }
}

/* ───────────────── <RequireAdmin> ─────────────────
   Wrap ONLY /admin/* routes. Redirects to /_/login when not authed
   AND you’re actually on an admin route. Keeps your place via ?next=.
   If authed and you land on /_/login, bounce to next/admin.
---------------------------------------------------------------- */
export function RequireAdmin({ children }) {
  const nav = useNavigate();
  const loc = useLocation();

  // seed from storage to avoid flicker on first paint
  const [authed, setAuthed] = useState(isAuthed());

  useEffect(() => {
    const onChange = () => setAuthed(isAuthed());
    window.addEventListener("storage", onChange);
    window.addEventListener("authChange", onChange);
    return () => {
      window.removeEventListener("storage", onChange);
      window.removeEventListener("authChange", onChange);
    };
  }, []);

  useEffect(() => {
    const path = loc.pathname || "/";
    const onAdmin = path.startsWith("/admin");
    const onLogin = path === LOGIN_PATH;

    // If not authed and trying to view admin → send to login with next
    if (!authed && onAdmin) {
      const next = encodeURIComponent(path + (loc.search || "") + (loc.hash || ""));
      nav(`${LOGIN_PATH}?next=${next}`, { replace: true });
      return;
    }

    // If authed but on login → send to "next" or admin home
    if (authed && onLogin) {
      const params = new URLSearchParams(loc.search || "");
      const n = params.get("next");
      nav(n || ADMIN_HOME, { replace: true });
      return;
    }
  }, [authed, loc, nav]);

  // Only render children when:
  // - authed on admin routes
  // - or any non-admin route (public) regardless of auth (this guard should only wrap /admin/*)
  return children ?? null;
}
