import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = String(
  import.meta.env.VITE_SUPABASE_URL ||
    import.meta.env.NEXT_PUBLIC_SUPABASE_URL ||
    ""
).trim();

const SUPABASE_ANON_KEY = String(
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
    import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    ""
).trim();

function missingEnvMessage() {
  return (
    "Supabase client is not configured.\n" +
    "Create frontend/web/.env.local (same folder as vite.config.js) and add:\n" +
    "VITE_SUPABASE_URL=...\n" +
    "VITE_SUPABASE_ANON_KEY=...\n" +
    "Then restart Vite."
  );
}

export const supabase =
  SUPABASE_URL && SUPABASE_ANON_KEY
    ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      })
    : new Proxy(
        {},
        {
          get() {
            throw new Error(missingEnvMessage());
          },
        }
      );