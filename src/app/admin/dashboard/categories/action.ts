"use server";

import { createClient } from "@/lib/supabase/server";
import { categorySchema } from "@/lib/validations/categories.schema";
import { CategoryFormState } from "@/types/category";
import { revalidatePath } from "next/cache";

// Fungsi untuk mengubah string menjadi slug (contoh: "Mining Resources" -> "mining-resources")
function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function adminUpsertCategory(
  categoryId: string | null,
  prevState: CategoryFormState,
  formData: FormData,
): Promise<CategoryFormState> {
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

  const validated = categorySchema.safeParse(rawData);
  if (!validated.success) {
    return {
      status: "error",
      errors: { ...prevState.errors, _form: [] },
    };
  }

  // Generate slug otomatis dari nama kategori
  const slug = generateSlug(validated.data.name);

  const payload = {
    name: validated.data.name,
    slug,
  };

  let error = null;

  if (categoryId) {
    const { error: updateError } = await supabase
      .from("categories")
      .update(payload)
      .eq("id", categoryId);
    error = updateError;
  } else {
    const { error: insertError } = await supabase
      .from("categories")
      .insert(payload);
    error = insertError;
  }

  if (error) {
    return {
      status: "error",
      errors: { ...prevState.errors, _form: [error.message] },
    };
  }

  revalidatePath("/admin/dashboard/categories", "page");
  return {
    status: "success",
    errors: {
      name: [],
      slug: [],
      _form: [],
    },
  };
}

export async function adminDeleteCategories(
  ids: string[],
): Promise<{ success: boolean; message?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, message: "Unauthorized" };

  const { error } = await supabase.from("categories").delete().in("id", ids);

  if (error) return { success: false, message: error.message };

  revalidatePath("/admin/dashboard/categories", "page");
  return { success: true };
}
