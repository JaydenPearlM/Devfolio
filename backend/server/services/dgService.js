import { getClient } from "../utils/supabase.js";

export async function fetchDog() {
  const supabase = await getClient();

  const { data, error } = await supabase
    .from("dog")
    .select("*")
    .limit(1)
    .single();

  if (error) throw error;

  return data;
}