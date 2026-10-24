import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ExportProduct } from "@/types/export-product";
import { Category } from "@/types/category";
import { Country } from "@/types/country";
import { Unit } from "@/types/unit";
import { Currency } from "@/types/currency";
import ExportProductPage from "./_components/export-products";

const PAGE_SIZE = 6;

export default async function UserProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const {
    data: products,
    count,
    error,
  } = await supabase
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
    .eq("profile_id", user.id)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    console.error("Error fetching products:", error);
  }

  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));

  const [
    { data: categories },
    { data: countries },
    { data: units },
    { data: currencies },
  ] = await Promise.all([
    supabase.from("categories").select("*").order("name"),
    supabase.from("countries").select("*").order("name"),
    supabase.from("units").select("*").order("name"),
    supabase.from("currencies").select("*").order("code"),
  ]);

  return (
    <ExportProductPage
      initialProducts={(products || []) as ExportProduct[]}
      categories={(categories || []) as Category[]}
      countries={(countries || []) as Country[]}
      units={(units || []) as Unit[]}
      currencies={(currencies || []) as Currency[]}
      profileId={user.id}
      initialPage={page}
      totalPages={totalPages}
      pageSize={PAGE_SIZE}
    />
  );
}