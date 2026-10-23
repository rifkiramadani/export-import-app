"use server";

import { createClient } from "@/lib/supabase/server";
import { profileSchema } from "@/lib/validations/profile.schema";
import { ProfileFormState } from "@/types/profile";
import { revalidatePath } from "next/cache";
import z from "zod";

export async function updateProfile(
  prevState: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      status: "error",
      errors: {
        ...prevState.errors,
        _form: ["Unauthorized Access"],
      },
    };
  }

  const rawData = {
    name: formData.get("name") as string,
    company_name: formData.get("company_name") as string,
    bio: formData.get("bio") as string,
    avatar_url: formData.get("avatar_url") as string,
    banner_url: formData.get("banner_url") as string,
    country_id: formData.get("country_id") as string,
    whatsapp: formData.get("whatsapp") as string,
  };

  const validated = profileSchema.safeParse(rawData);
  if (!validated.success) {
    return {
      status: "error",
      errors: z.flattenError(validated.error).fieldErrors,
    };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      name: validated.data.name,
      company_name: validated.data.company_name,
      bio: validated.data.bio || null,
      avatar_url: validated.data.avatar_url || null,
      banner_url: validated.data.banner_url || null,
      country_id: validated.data.country_id || null,
      whatsapp: validated.data.whatsapp,
    })
    .eq("id", user.id)
    .select("id");

  if (error) {
    return {
      status: "error",
      errors: {
        ...prevState.errors,
        _form: [error.message],
      },
    };
  }

  revalidatePath("/user/dashboard/profile", "page");
  return {
    status: "success",
    errors: {
      name: [],
      company_name: [],
      bio: [],
      avatar_url: [],
      banner_url: [],
      country_id: [],
      whatsapp: [],
      _form: [],
    },
  };
}
