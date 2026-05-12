// Do not delete
// backend/server/middleware/auth.js

// Supabase-backed admin verification middleware.
// Expects Authorization: Bearer <supabase_access_token>
//
// Configure allowed admins via env (server-side):
// ADMIN_EMAILS=you@example.com,other@example.com
//
// This replaces the old custom JWT ("sub":"admin") flow.

import { getAdminClient } from "../utils/supabase.js";

const ADMIN_EMAILS = String(process.env.ADMIN_EMAILS || "")
  .split(",")
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

export async function verifyAdmin(req, res, next) {
  const h = req.headers.authorization || "";
  const token = h.startsWith("Bearer ") ? h.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: "No auth token" });
  }

  try {
    const supabase = getAdminClient();

    // Validate token and fetch user
    const { data, error } = await supabase.auth.getUser(token);

    if (error) {
      return res.status(401).json({ error: "Invalid auth token" });
    }

    const user = data?.user;
    const email = user?.email ? String(user.email).toLowerCase() : "";

    if (!email) {
      return res.status(403).json({ error: "No email on user" });
    }

    if (!ADMIN_EMAILS.length) {
      return res
        .status(403)
        .json({ error: "Server ADMIN_EMAILS not configured" });
    }

    if (!ADMIN_EMAILS.includes(email)) {
      return res.status(403).json({ error: "Not an admin" });
    }

    // attach admin info to request
    req.admin = {
      user_id: user.id,
      email,
    };

    next();
  } catch (e) {
    console.error("[auth.verifyAdmin]", e);

    return res.status(401).json({ error: "Auth failed" });
  }
}