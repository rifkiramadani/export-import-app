"use server";

import { createClient } from "@/lib/supabase/server";
import { userSchema } from "@/lib/validations/users.schema";
import { UserFormState } from "@/types/user";
import { revalidatePath } from "next/cache";

export async function adminUpsertUser(
  userId: string | null,
  prevState: UserFormState,
  formData: FormData,
): Promise<UserFormState> {
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
    company_name: formData.get("company_name") as string,
    role: formData.get("role") as "admin" | "user",
    avatar_url: formData.get("avatar_url") as string,
    banner_url: formData.get("banner_url") as string,
  };

  const validated = userSchema.safeParse(rawData);
  if (!validated.success) {
    return {
      status: "error",
      errors: { ...prevState.errors, _form: [] },
    };
  }

  const payload = {
    name: validated.data.name,
    company_name: validated.data.company_name || null,
    role: validated.data.role,
    avatar_url: validated.data.avatar_url || null,
    banner_url: validated.data.banner_url || null,
  };

  let error = null;

  if (userId) {
    const { error: updateError } = await supabase
      .from("profiles")
      .update(payload)
      .eq("id", userId);
    error = updateError;
  } else {
    return {
      status: "error",
      errors: {
        ...prevState.errors,
        _form: ["New users must register via sign up."],
      },
    };
  }

  if (error) {
    return {
      status: "error",
      errors: { ...prevState.errors, _form: [error.message] },
    };
  }

  revalidatePath("/admin/dashboard/users", "page");
  return {
    status: "success",
    errors: {
      name: [],
      company_name: [],
      role: [],
      avatar_url: [],
      banner_url: [],
      _form: [],
    },
  };
}

export async function adminDeleteUsers(
  ids: string[],
): Promise<{ success: boolean; message?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, message: "Unauthorized" };

  const { error } = await supabase.from("profiles").delete().in("id", ids);

  if (error) return { success: false, message: error.message };

  revalidatePath("/admin/dashboard/users", "page");
  return { success: true };
}
