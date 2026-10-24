import { createClient } from "@/lib/supabase/server";
import { getCountries } from "@/services/master";
import { redirect } from "next/navigation";
import AdminProfileComponent from "./_components/profile";

export default async function AdminProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select(
      `
        *,
        country:countries(id, name, code)
      `,
    )
    .eq("id", user.id)
    .single();

  if (error) {
    console.error("Error fetching admin profile", error);
  }

  const countries = await getCountries();

  return (
    <AdminProfileComponent
      profile={profile}
      countries={countries}
      email={user.email ?? ""}
    />
  );
}
