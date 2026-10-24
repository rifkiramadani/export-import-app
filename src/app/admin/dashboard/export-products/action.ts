"use server";

import { createClient } from "@/lib/supabase/server";
import { exportProductSchema } from "@/lib/validations/export-products.schema";
import { ExportProductFormState } from "@/types/export-product";
import { revalidatePath } from "next/cache";

export async function adminUpsertProduct(
  productId: string | null,
  prevState: ExportProductFormState,
  formData: FormData,
): Promise<ExportProductFormState> {
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
    min_order: formData.get("min_order") as string,
    whatsapp_number: formData.get("whatsapp_number") as string,
    image_url: formData.get("image_url") as string,
    category_id: formData.get("category_id") as string,
    country_id: formData.get("country_id") as string,
    unit_id: formData.get("unit_id") as string,
    currency_id: formData.get("currency_id") as string,
    quantity: formData.get("quantity") as string,
  };

  const validated = exportProductSchema.safeParse(rawData);
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
    min_order: Number(validated.data.min_order),
    whatsapp_number: validated.data.whatsapp_number,
    image_url: validated.data.image_url || null,
    category_id: validated.data.category_id,
    country_id: validated.data.country_id,
    unit_id: validated.data.unit_id,
    currency_id: validated.data.currency_id,
    quantity: Number(validated.data.quantity),
  };

  let error = null;

  if (productId) {
    const { error: updateError } = await supabase
      .from("export_products")
      .update(payload)
      .eq("id", productId);
    error = updateError;
  } else {
    const { error: insertError } = await supabase
      .from("export_products")
      .insert({ ...payload, profile_id: user.id });
    error = insertError;
  }

  if (error) {
    return {
      status: "error",
      errors: { ...prevState.errors, _form: [error.message] },
    };
  }

  revalidatePath("/admin/dashboard/products", "page");
  return {
    status: "success",
    errors: {
      title: [],
      description: [],
      price: [],
      min_order: [],
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

export async function adminDeleteProducts(
  ids: string[],
): Promise<{ success: boolean; message?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, message: "Unauthorized" };

  const { error } = await supabase
    .from("export_products")
    .delete()
    .in("id", ids);

  if (error) return { success: false, message: error.message };

  revalidatePath("/admin/dashboard/products", "page");
  return { success: true };
}