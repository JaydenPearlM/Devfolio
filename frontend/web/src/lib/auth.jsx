// frontend/web/src/lib/auth.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { supabase } from "./supabaseClient";

const LOGIN_PATH = "/admin/login";

const ADMIN_EMAILS = String(import.meta.env.VITE_ADMIN_EMAILS || "")
  .split(",")
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

function isAllowedAdminEmail(email) {
  const normalized = String(email || "").trim().toLowerCase();
  if (!normalized) return false;
  return ADMIN_EMAILS.includes(normalized);
}

async function fetchSupabaseSession() {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) return null;
    return data?.session || null;
  } catch {
    return null;
  }
}

async function fetchSupabaseUser() {
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error) return null;
    return data?.user || null;
  } catch {
    return null;
  }
}

export async function getSession() {
  return fetchSupabaseSession();
}

export async function getUser() {
  return fetchSupabaseUser();
}

export async function isAdminUser() {
  const user = await getUser();
  const email = user?.email ? String(user.email).toLowerCase() : "";
  return isAllowedAdminEmail(email);
}

export async function signInWithPassword(identifier, password) {
  const rawIdentifier = String(identifier || "").trim();
  const rawPassword = String(password || "");

  if (!rawIdentifier || !rawPassword) {
    return {
      data: { session: null, user: null },
      error: new Error("Email and password are required."),
    };
  }

  // Only accept email format
  if (!rawIdentifier.includes("@")) {
    return {
      data: { session: null, user: null },
      error: new Error("Please enter a valid email address."),
    };
  }

  // Login with email directly
  return supabase.auth.signInWithPassword({
    email: rawIdentifier,
    password: rawPassword,
  });
}

export async function signOut() {
  try {
    await supabase.auth.signOut();
  } catch {
    // ignore
  }
}

export function useAdminAuth() {
  const [state, setState] = useState(() => ({
    loading: true,
    session: null,
    user: null,
    isAdmin: false,
  }));

  useEffect(() => {
    let alive = true;

    async function refresh() {
      const session = await fetchSupabaseSession();
      const user = session?.user || null;
      const email = user?.email ? String(user.email).toLowerCase() : "";

      if (alive) {
        setState({
          loading: false,
          session,
          user,
          isAdmin: isAllowedAdminEmail(email),
        });
      }
    }

    refresh();

    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      refresh();
    });

    return () => {
      alive = false;
      try {
        sub?.subscription?.unsubscribe();
      } catch {
        // ignore
      }
    };
  }, []);

  return state;
}

export function isAuthedSync(session) {
  return Boolean(session);
}

export function RequireAdmin({ children }) {
  const loc = useLocation();
  const { loading, isAdmin } = useAdminAuth();

  const next = useMemo(() => {
    const p = loc?.pathname || "/admin";
    const s = loc?.search || "";
    const h = loc?.hash || "";
    return encodeURIComponent(`${p}${s}${h}`);
  }, [loc]);

  if (loading) {
    return (
      <div style={{ padding: 24 }}>
        <div style={{ fontWeight: 600 }}>Checking admin...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to={`${LOGIN_PATH}?next=${next}`} replace />;
  }

  return children;
}