import { createClient } from "@/lib/supabase/server";
import { getCountries } from "@/services/master";
import { redirect } from "next/navigation";
import ProfileUser from "./_components/profile";

export default async function UserProfilePage() {
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
    console.error("Error fetching profile", error);
  }

  const countries = await getCountries();

  return (
    <ProfileUser
      profile={profile}
      countries={countries}
      email={user.email ?? ""}
    />
  );
}