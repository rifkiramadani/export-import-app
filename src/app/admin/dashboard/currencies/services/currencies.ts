import { createClient } from "@/lib/supabase/client";
import { Currency } from "@/types/currency";

interface FetchAdminCurrenciesParams {
  page: number;
  pageSize: number;
  search?: string;
}

export async function fetchAdminCurrencies({
  page,
  pageSize,
  search,
}: FetchAdminCurrenciesParams) {
  const supabase = createClient();
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase.from("currencies").select("*", { count: "exact" });

  const keyword = search?.trim().replace(/[,()]/g, " ");
  if (keyword) {
    query = query.or(
      `name.ilike.%${keyword}%,code.ilike.%${keyword}%,symbol.ilike.%${keyword}%`,
    );
  }

  const { data, count, error } = await query
    .order("code", { ascending: true })
    .range(from, to);

  if (error) throw new Error(error.message);

  return {
    data: (data ?? []) as Currency[],
    totalPages: Math.max(1, Math.ceil((count ?? 0) / pageSize)),
  };
}
