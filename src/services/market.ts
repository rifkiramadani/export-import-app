import { createClient } from "@/lib/supabase/client";
import { MarketFilterParams } from "@/types/market-filter-params";

export async function fetchMarketItems(params: MarketFilterParams) {
  const supabase = createClient();
  const page = params.page || 1;
  const limit = params.limit || 6;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  // decide which table will be queried based on type of dropdown category (export | import)
  const tableName =
    params.type === "export" ? "export_products" : "import_products";

  let query = supabase.from(tableName).select(
    `
        *,
        category:categories(id, name),
        country:countries(id, name, code),
        unit:units(id, name),
        currency:currencies(id, code, name, symbol),
        profile:profiles(name, company_name)
        `,
    { count: "exact" },
  );

  // filter based on (title or description)
  if (params.search) {
    query = query.or(
      `title.ilike%${params.search}%, description.ilike%${params.search}%`,
    );
  }

  // filter based on category
  if (params.categoryId && params.categoryId !== "all") {
    query = query.eq("category_id", params.categoryId);
  }

  // filter based on country
  if (params.countryId && params.countryId !== "all") {
    query = query.eq("country_id", params.countryId);
  }

  // implement pagination & order desc
  const { data, count, error } = await query
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    console.error("Error Fetching Market Items: ", error);
    throw new Error(error.message);
  }

  return {
    data: data || [],
    totalCount: count || 0,
    totalPages: Math.ceil((count || 0) / limit),
    currentPage: page,
  };
}
