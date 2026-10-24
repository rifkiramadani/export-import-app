"use server";

import { createClient } from "@/lib/supabase/server";
import { importRequestSchema } from "@/lib/validations/import-requests.schema";
import { ImportRequestFormState } from "@/types/import-request";
import { revalidatePath } from "next/cache";

export async function adminUpsertImportRequest(
  requestId: string | null,
  prevState: ImportRequestFormState,
  formData: FormData,
): Promise<ImportRequestFormState> {
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
    title: formData.get("title") as string,
    description: formData.get("description") as string,
    price: formData.get("price") as string,
    target_quantity: formData.get("target_quantity") as string,
    whatsapp_number: formData.get("whatsapp_number") as string,
    image_url: formData.get("image_url") as string,
    category_id: formData.get("category_id") as string,
    country_id: formData.get("country_id") as string,
    unit_id: formData.get("unit_id") as string,
    currency_id: formData.get("currency_id") as string,
  };

  const validated = importRequestSchema.safeParse(rawData);
  if (!validated.success) {
    return {
      status: "error",
      errors: { ...prevState.errors, _form: [] },
    };
  }

  const payload = {
    title: validated.data.title,
    description: validated.data.description || null,
    price: Number(validated.data.price),
    target_quantity: Number(validated.data.target_quantity),
    whatsapp_number: validated.data.whatsapp_number,
    image_url: validated.data.image_url || null,
    category_id: validated.data.category_id,
    country_id: validated.data.country_id,
    unit_id: validated.data.unit_id,
    currency_id: validated.data.currency_id,
  };

  let error = null;

  if (requestId) {
    const { error: updateError } = await supabase
      .from("import_requests")
      .update(payload)
      .eq("id", requestId);
    error = updateError;
  } else {
    const { error: insertError } = await supabase
      .from("import_requests")
      .insert({ ...payload, profile_id: user.id });
    error = insertError;
  }

  if (error) {
    return {
      status: "error",
      errors: { ...prevState.errors, _form: [error.message] },
    };
  }

  revalidatePath("/admin/dashboard/import-requests", "page");
  return {
    status: "success",
    errors: {
      title: [],
      description: [],
      price: [],
      target_quantity: [],
      whatsapp_number: [],
      image_url: [],
      category_id: [],
      country_id: [],
      unit_id: [],
      currency_id: [],
      _form: [],
    },
  };
}

export async function adminDeleteImportRequests(
  ids: string[],
): Promise<{ success: boolean; message?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, message: "Unauthorized" };

  const { error } = await supabase
    .from("import_requests")
    .delete()
    .in("id", ids);

  if (error) return { success: false, message: error.message };

  revalidatePath("/admin/dashboard/import-requests", "page");
  return { success: true };
}
