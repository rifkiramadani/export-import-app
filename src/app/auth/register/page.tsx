import { createClient } from "@/lib/supabase/server";
import Register from "./_components/register";

const Page = async () => {
  const supabase = await createClient();

  const { data: countries, error } = await supabase
    .from("countries")
    .select("id, name, code")
    .order("name", { ascending: true });

  if (error) {
    console.error("gagal mengambil data countries", error.message);
  }

  return (
    <Register
      title="Register"
      description="Fill the form below to register"
      countries={countries || []}
    />
  );
};

export default Page;
