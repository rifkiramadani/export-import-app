import { createClient } from "@/lib/supabase/client";
import { Profile } from "@/types/user";

interface FetchAdminUsersParams {
  page: number;
  pageSize: number;
  search?: string;
  role?: string;
}

export async function fetchAdminUsers({
  page,
  pageSize,
  search,
  role,
}: FetchAdminUsersParams) {
  const supabase = createClient();
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase.from("profiles").select("*", { count: "exact" });

  const keyword = search?.trim().replace(/[,()]/g, " ");
  if (keyword) {
    query = query.or(`name.ilike.%${keyword}%,company_name.ilike.%${keyword}%`);
  }

  if (role && role !== "all") {
    query = query.eq("role", role);
  }

  const { data, count, error } = await query
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) throw new Error(error.message);

  return {
    data: (data ?? []) as Profile[],
    totalPages: Math.max(1, Math.ceil((count ?? 0) / pageSize)),
  };
}
