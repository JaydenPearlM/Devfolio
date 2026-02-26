// backend/server/controllers/dogController.js
const { getAdminClient } = require("../utils/supabase");

const DOG_KEY = "global";
const FED_MINUTES = Number(process.env.DOG_FED_MINUTES || 5);

async function ensureRow() {
  const supabase = getAdminClient();

  // Upsert ensures row exists
  const { error } = await supabase
    .from("dog_state")
    .upsert([{ key: DOG_KEY, fed_until: null }], { onConflict: "key" });

  if (error) throw error;
}

async function updateDogFedFlag(isFed) {
  const supabase = getAdminClient();
  await ensureRow();

  // Avoid numeric separators for older Node compatibility
  const fedUntil = isFed
    ? new Date(Date.now() + FED_MINUTES * 60 * 1000).toISOString()
    : null;

  const { error } = await supabase
    .from("dog_state")
    .update({ fed_until: fedUntil })
    .eq("key", DOG_KEY);

  if (error) throw error;
}

async function getDogFedFlag() {
  const supabase = getAdminClient();
  await ensureRow();

  const { data, error } = await supabase
    .from("dog_state")
    .select("fed_until")
    .eq("key", DOG_KEY)
    .single();

  if (error) throw error;

  const until = data && data.fed_until ? new Date(data.fed_until) : null;

  if (!until) return false;

  return until.getTime() > Date.now();
}

module.exports = {
  updateDogFedFlag,
  getDogFedFlag,
};