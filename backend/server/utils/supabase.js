// backend/server/utils/supabase.js
const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = process.env.SUPABASE_URL;

// Server-side (service role) key: for INSERT/UPDATE/DELETE + Storage writes
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Optional anon key: for safe read clients (if you want)
const ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("[supabase] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
}

let adminClient = null;
let publicClient = null;

function getAdminClient() {
  if (adminClient) return adminClient;

  adminClient = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch },
  });

  return adminClient;
}

function getClient() {
  // If anon key isn't set, fall back to admin client for reads (still works)
  if (!ANON_KEY) return getAdminClient();
  if (publicClient) return publicClient;

  publicClient = createClient(SUPABASE_URL, ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch },
  });

  return publicClient;
}

/**
 * Upload an in-memory buffer to Supabase Storage and return a PUBLIC url.
 * Requires bucket to be PUBLIC, or you’ll need signed URLs instead.
 */
async function uploadBuffer({ bucket, path, buffer, contentType, upsert = true }) {
  const supabase = getAdminClient();

  const { error: upErr } = await supabase.storage
    .from(bucket)
    .upload(path, buffer, { contentType, upsert });

  if (upErr) throw upErr;

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

module.exports = { getAdminClient, getClient, uploadBuffer };