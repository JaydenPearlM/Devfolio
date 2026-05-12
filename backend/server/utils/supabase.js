// do not delete
// backend/server/utils/supabase.js

import { createClient } from "@supabase/supabase-js";

/*
Ensure an environment variable exists.
Accepts multiple possible names.
*/
function requireEnvAny(names) {
  for (const name of names) {
    const v = process.env[name];
    if (v && String(v).trim()) {
      return String(v).trim();
    }
  }

  throw new Error(
    `[supabase] Missing env var. Tried: ${names.join(", ")}`
  );
}

/*
Cached clients
*/
let client;
let adminClient;

/*
Public client (anon key)
Used for safe reads if needed
*/
export function getClient() {
  if (!client) {
    const url = requireEnvAny([
      "SUPABASE_URL",
      "VITE_SUPABASE_URL",
      "NEXT_PUBLIC_SUPABASE_URL",
    ]);

    const key = requireEnvAny([
      "SUPABASE_ANON_KEY",
      "SUPABASE_PUBLIC_KEY",
      "VITE_SUPABASE_ANON_KEY",
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    ]);

    client = createClient(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });
  }

  return client;
}

/*
Admin client (service role key)
Used for inserts, deletes, storage, analytics, etc.
NEVER expose this key to frontend code.
*/
export function getAdminClient() {
  if (!adminClient) {
    const url = requireEnvAny([
      "SUPABASE_URL",
      "VITE_SUPABASE_URL",
      "NEXT_PUBLIC_SUPABASE_URL",
    ]);

    const key = requireEnvAny([
      "SUPABASE_SERVICE_ROLE_KEY",
      "SUPABASE_SERVICE_KEY",
      "SUPABASE_SERVICE_ROLE",
    ]);

    adminClient = createClient(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });
  }

  return adminClient;
}

/*
Upload helper for Supabase Storage
Used by projects.js
*/
export async function uploadBuffer({
  bucket,
  path,
  buffer,
  contentType,
  upsert = true,
}) {
  const supabase = getAdminClient();

  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, buffer, {
      contentType,
      upsert,
    });

  if (error) {
    throw error;
  }

  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(path);

  return data.publicUrl;
}