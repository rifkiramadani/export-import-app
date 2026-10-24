import { createClient } from "@/lib/supabase/client";
import { ExportProduct } from "@/types/export-product";

export async function fetchUserExportProducts(
  profileId: string,
  page: number,
  pageSize: number,
) {
  const supabase = createClient();
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, count, error } = await supabase
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
    .eq("profile_id", profileId)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) throw new Error(error.message);

  return {
    data: (data ?? []) as ExportProduct[],
    totalPages: Math.max(1, Math.ceil((count ?? 0) / pageSize)),
  };
}
