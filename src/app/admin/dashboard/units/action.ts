"use server";

import { createClient } from "@/lib/supabase/server";
import { unitSchema } from "@/lib/validations/units.schema";
import { UnitFormState } from "@/types/unit";
import { revalidatePath } from "next/cache";

export async function adminUpsertUnit(
  unitId: string | null,
  prevState: UnitFormState,
  formData: FormData,
): Promise<UnitFormState> {
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
  };

  const validated = unitSchema.safeParse(rawData);
  if (!validated.success) {
    return {
      status: "error",
      errors: { ...prevState.errors, _form: [] },
    };
  }

  const payload = {
    name: validated.data.name,
  };

  let error = null;

  if (unitId) {
    const { error: updateError } = await supabase
      .from("units")
      .update(payload)
      .eq("id", unitId);
    error = updateError;
  } else {
    const { error: insertError } = await supabase.from("units").insert(payload);
    error = insertError;
  }

  if (error) {
    return {
      status: "error",
      errors: { ...prevState.errors, _form: [error.message] },
    };
  }

  revalidatePath("/admin/dashboard/units", "page");
  return {
    status: "success",
    errors: {
      name: [],
      _form: [],
    },
  };
}

export async function adminDeleteUnits(
  ids: string[],
): Promise<{ success: boolean; message?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, message: "Unauthorized" };

  const { error } = await supabase.from("units").delete().in("id", ids);

  if (error) return { success: false, message: error.message };

  revalidatePath("/admin/dashboard/units", "page");
  return { success: true };
}
