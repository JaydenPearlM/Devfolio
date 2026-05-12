import { getClient } from "../utils/supabase.js";

export async function fetchProjects() {
  const supabase = await getClient();

  const { data, error } = await supabase
    .from("Devfolio")
    .select("*");

  if (error) throw error;

  return data;
}