
// frontend/src/lib/supabaseClient.js
// Vite + Supabase client
// Reads env vars from .env.local (or .env) in the Vite project root:
//   VITE_SUPABASE_URL
//   VITE_SUPABASE_ANON_KEY

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL || "").trim();
const SUPABASE_ANON_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY || "").trim();

function missingEnvMessage() {
  return (
    "Supabase client is not configured.\n" +
    "Create a file named .env.local in your Vite frontend root (same folder as vite.config.js).\n" +
    "Add:\n" +
    "VITE_SUPABASE_URL=...\n" +
    "VITE_SUPABASE_ANON_KEY=...\n" +
    "Then restart Vite (CTRL+C then npm run dev)."
  );
}

// Create a client if configured; otherwise create a stub that throws a helpful error.
export const supabase =
  SUPABASE_URL && SUPABASE_ANON_KEY
    ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: { persistSession: false },
      })
    : new Proxy(
        {},
        {
          get() {
            throw new Error(missingEnvMessage());
          },
        }
      );

// Helpful console warning (won’t crash) — but any actual use of supabase will throw.
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn("[Supabase] Missing Vite env vars.", {
    VITE_SUPABASE_URL: !!SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY: !!SUPABASE_ANON_KEY,
  });
}