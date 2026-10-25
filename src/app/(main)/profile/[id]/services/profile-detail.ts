import { createClient } from "@/lib/supabase/client";
import { Profile } from "@/types/profile";
import { MarketItem } from "@/types/market";

export async function fetchPublicProfile(
  userId: string,
): Promise<Profile | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select(
      `
      *,
      country:countries(id, name, code)
    `,
    )
    .eq("id", userId)
    .single();

  if (error || !data) return null;
  return data as Profile;
}

interface FetchUserMarketItemsParams {
  userId: string;
  type: "export" | "import";
  page: number;
  pageSize: number;
  search?: string;
  categoryId?: string;
}

export async function fetchUserMarketItems({
  userId,
  type,
  page,
  pageSize,
  search,
  categoryId,
}: FetchUserMarketItemsParams) {
  const supabase = createClient();
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  // Membedakan tabel dan kolom urutan berdasarkan DDL (export_products pakai create_at)
  const tableName = type === "export" ? "export_products" : "import_requests";
  const orderColumn = "created_at";

  let query = supabase
    .from(tableName)
    .select(
      `
      *,
      category:categories(id, name),
      country:countries(id, name, code),
      currency:currencies(id, name, symbol),
      unit:units(id, name),
      profile:profiles(id, name, company_name, whatsapp, avatar_url)
    `,
      { count: "exact" },
    )
    .eq("profile_id", userId);

  const keyword = search?.trim().replace(/[,()]/g, " ");
  if (keyword) {
    query = query.ilike("title", `%${keyword}%`);
  }

  if (categoryId && categoryId !== "all") {
    query = query.eq("category_id", categoryId);
  }

  const { data, count, error } = await query
    .order(orderColumn, { ascending: false })
    .range(from, to);

  if (error) {
    console.error(`Error loading ${tableName}:`, error.message);
    throw new Error(error.message);
  }

  return {
    data: (data ?? []) as MarketItem[],
    totalPages: Math.max(1, Math.ceil((count ?? 0) / pageSize)),
  };
}
