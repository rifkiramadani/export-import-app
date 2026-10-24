import { createClient } from "@/lib/supabase/client";
import { ImportRequest } from "@/types/import-request";

interface FetchAdminImportRequestsParams {
  page: number;
  pageSize: number;
  search?: string;
  categoryId?: string;
  countryId?: string;
}

export async function fetchAdminImportRequests({
  page,
  pageSize,
  search,
  categoryId,
  countryId,
}: FetchAdminImportRequestsParams) {
  const supabase = createClient();
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase.from("import_requests").select(
    `
      *,
      category:categories(id, name),
      country:countries(id, name, code),
      unit:units(id, name),
      currency:currencies(id, symbol, code),
      profile:profiles(name, company_name)
    `,
    { count: "exact" },
  );

  const keyword = search?.trim().replace(/[,()]/g, " ");
  if (keyword) {
    query = query.or(`title.ilike.%${keyword}%,description.ilike.%${keyword}%`);
  }

  if (categoryId && categoryId !== "all") {
    query = query.eq("category_id", categoryId);
  }

  if (countryId && countryId !== "all") {
    query = query.eq("country_id", countryId);
  }

  const { data, count, error } = await query
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) throw new Error(error.message);

  return {
    data: (data ?? []) as ImportRequest[],
    totalPages: Math.max(1, Math.ceil((count ?? 0) / pageSize)),
  };
}
