import { createClient } from "@/lib/supabase/client";
import { Category } from "@/types/category";

interface FetchAdminCategoriesParams {
  page: number;
  pageSize: number;
  search?: string;
}

export async function fetchAdminCategories({
  page,
  pageSize,
  search,
}: FetchAdminCategoriesParams) {
  const supabase = createClient();
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("categories")
    .select("*", { count: "exact" });

  const keyword = search?.trim().replace(/[,()]/g, " ");
  if (keyword) {
    query = query.ilike("name", `%${keyword}%`);
  }

  const { data, count, error } = await query
    .order("name", { ascending: true })
    .range(from, to);

  if (error) throw new Error(error.message);

  return {
    data: (data ?? []) as Category[],
    totalPages: Math.max(1, Math.ceil((count ?? 0) / pageSize)),
  };
}