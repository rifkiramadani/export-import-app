import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ImportRequest } from "@/types/import-request";
import { Category } from "@/types/category";
import { Country } from "@/types/country";
import { Unit } from "@/types/unit";
import { Currency } from "@/types/currency";
import ImportRequestsPage from "./_components/import-requests";

export default async function UserImportRequestsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: requests, error } = await supabase
    .from("import_requests")
    .select(
      `
      *,
      category:categories(id, name),
      country:countries(id, name, code),
      unit:units(id, name),
      currency:currencies(id, symbol, code)
    `,
    )
    .eq("profile_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching import requests:", error);
  }

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
    <ImportRequestsPage
      initialRequests={(requests || []) as ImportRequest[]}
      categories={(categories || []) as Category[]}
      countries={(countries || []) as Country[]}
      units={(units || []) as Unit[]}
      currencies={(currencies || []) as Currency[]}
      profileId={user.id}
    />
  );
}
