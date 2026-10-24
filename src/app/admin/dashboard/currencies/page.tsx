import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Currency } from "@/types/currency";
import AdminCurrenciesPage from "./_components/currencies";

const PAGE_SIZE = 6;

export default async function AdminCurrenciesRootPage({
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

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    redirect("/user/dashboard/profile");
  }

  const {
    data: currencies,
    count,
    error,
  } = await supabase
    .from("currencies")
    .select("*", { count: "exact" })
    .order("code", { ascending: true })
    .range(from, to);

  if (error) {
    console.error("Error fetching admin currencies:", error);
  }

  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));

  return (
    <AdminCurrenciesPage
      initialCurrencies={(currencies || []) as Currency[]}
      initialPage={page}
      totalPages={totalPages}
      pageSize={PAGE_SIZE}
    />
  );
}