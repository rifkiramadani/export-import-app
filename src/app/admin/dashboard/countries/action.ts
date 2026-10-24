"use server";

import { createClient } from "@/lib/supabase/server";
import { countrySchema } from "@/lib/validations/countries.schema";
import { CountryFormState } from "@/types/country";
import { revalidatePath } from "next/cache";

export async function adminUpsertCountry(
  countryId: string | null,
  prevState: CountryFormState,
  formData: FormData,
): Promise<CountryFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      status: "error",
      errors: { ...prevState.errors, _form: ["Unauthorized Access"] },
    };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    return {
      status: "error",
      errors: { ...prevState.errors, _form: ["Access Denied: Admin only"] },
    };
  }

  const rawData = {
    name: formData.get("name") as string,
    code: formData.get("code") as string,
  };

  const validated = countrySchema.safeParse(rawData);
  if (!validated.success) {
    return {
      status: "error",
      errors: { ...prevState.errors, _form: [] },
    };
  }

  const payload = {
    name: validated.data.name,
    code: validated.data.code.toUpperCase(),
  };

  let error = null;

  if (countryId) {
    const { error: updateError } = await supabase
      .from("countries")
      .update(payload)
      .eq("id", countryId);
    error = updateError;
  } else {
    const { error: insertError } = await supabase
      .from("countries")
      .insert(payload);
    error = insertError;
  }

  if (error) {
    return {
      status: "error",
      errors: { ...prevState.errors, _form: [error.message] },
    };
  }

  revalidatePath("/admin/dashboard/countries", "page");
  return {
    status: "success",
    errors: {
      name: [],
      code: [],
      _form: [],
    },
  };
}

export async function adminDeleteCountries(
  ids: string[],
): Promise<{ success: boolean; message?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, message: "Unauthorized" };

  const { error } = await supabase
    .from("countries")
    .delete()
    .in("id", ids);

  if (error) return { success: false, message: error.message };

  revalidatePath("/admin/dashboard/countries", "page");
  return { success: true };
}