import { createClient } from "@/lib/supabase/client";
import { ExportProduct } from "@/types/export-product";

interface FetchUserExportProductsParams {
  profileId: string;
  page: number;
  pageSize: number;
  search?: string;
  categoryId?: string;
}

export async function fetchUserExportProducts({
  profileId,
  page,
  pageSize,
  search,
  categoryId,
}: FetchUserExportProductsParams) {
  const supabase = createClient();
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("export_products")
    .select(
      `
      *,
      category:categories(id, name),
      country:countries(id, name, code),
      unit:units(id, name),
      currency:currencies(id, symbol, code)
    `,
      { count: "exact" },
    )
    .eq("profile_id", profileId);

  // Karakter , ( ) merusak sintaks filter .or(), jadi dibuang dari input
  const keyword = search?.trim().replace(/[,()]/g, " ");
  if (keyword) {
    query = query.or(`title.ilike.%${keyword}%,description.ilike.%${keyword}%`);
  }

  if (categoryId && categoryId !== "all") {
    query = query.eq("category_id", categoryId);
  }

  const { data, count, error } = await query
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) throw new Error(error.message);

  return {
    data: (data ?? []) as ExportProduct[],
    totalPages: Math.max(1, Math.ceil((count ?? 0) / pageSize)),
  };
}