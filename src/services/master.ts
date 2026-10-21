import { createClient } from "@/lib/supabase/client";

export async function getCategories() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("name");
  if (error) {
    throw new Error(error.message);
  }
  return data || [];
}

export async function getCountries() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("countries")
    .select("*")
    .order("name");
  if (error) {
    throw new Error(error.message);
  }
  return data || [];
}
