import { createClient } from "@/lib/supabase/client";
import { Country } from "@/types/country";

interface FetchAdminCountriesParams {
  page: number;
  pageSize: number;
  search?: string;
}

export async function fetchAdminCountries({
  page,
  pageSize,
  search,
}: FetchAdminCountriesParams) {
  const supabase = createClient();
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase.from("countries").select("*", { count: "exact" });

  const keyword = search?.trim().replace(/[,()]/g, " ");
  if (keyword) {
    query = query.or(`name.ilike.%${keyword}%,code.ilike.%${keyword}%`);
  }

  const { data, count, error } = await query
    .order("name", { ascending: true })
    .range(from, to);

  if (error) throw new Error(error.message);

  return {
    data: (data ?? []) as Country[],
    totalPages: Math.max(1, Math.ceil((count ?? 0) / pageSize)),
  };
}
