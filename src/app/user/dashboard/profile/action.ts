"use server";

import { createClient } from "@/lib/supabase/server";
import { profileSchema } from "@/lib/validations/profile.schema";
import { ProfileFormState } from "@/types/profile";
import { revalidatePath } from "next/cache";
import z from "zod";

const AVATAR_BUCKET = "profiles";
const BANNER_BUCKET = "banners";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

function getStoragePath(
  url: string,
  bucket: string,
  userId: string,
): string | null {
  const marker = `/storage/v1/object/public/${bucket}/`;
  const index = url.indexOf(marker);
  if (index === -1) return null;

  const path = decodeURIComponent(
    url.slice(index + marker.length).split("?")[0],
  );

  return path.startsWith(`${userId}/`) ? path : null;
}

async function removeOldFile(
  supabase: SupabaseServerClient,
  bucket: string,
  userId: string,
  oldUrl: string | null | undefined,
  newUrl: string | null,
) {
  if (!oldUrl || oldUrl === newUrl) return;

  const path = getStoragePath(oldUrl, bucket, userId);
  if (!path) return;

  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) {
    console.error(`Failed to remove old file from "${bucket}":`, error.message);
  }
}

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
    password: formData.get("password") as string,
  };

  const validated = profileSchema.safeParse(rawData);
  if (!validated.success) {
    return {
      status: "error",
      errors: z.flattenError(validated.error).fieldErrors,
    };
  }

  const { data: oldProfile } = await supabase
    .from("profiles")
    .select("avatar_url, banner_url")
    .eq("id", user.id)
    .single();

  const newAvatarUrl = validated.data.avatar_url || null;
  const newBannerUrl = validated.data.banner_url || null;

  // 1. Update database profile
  const { data: updated, error } = await supabase
    .from("profiles")
    .update({
      name: validated.data.name,
      company_name: validated.data.company_name,
      bio: validated.data.bio || null,
      avatar_url: newAvatarUrl,
      banner_url: newBannerUrl,
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

  if (!updated || updated.length === 0) {
    return {
      status: "error",
      errors: {
        ...prevState.errors,
        _form: ["Profile was not updated. Check the RLS update policy."],
      },
    };
  }

  // 2. Update password auth jika diisi
  if (validated.data.password && validated.data.password.trim() !== "") {
    const { error: passwordError } = await supabase.auth.updateUser({
      password: validated.data.password,
    });

    if (passwordError) {
      return {
        status: "error",
        errors: {
          ...prevState.errors,
          _form: [passwordError.message],
        },
      };
    }
  }

  await Promise.all([
    removeOldFile(
      supabase,
      AVATAR_BUCKET,
      user.id,
      oldProfile?.avatar_url,
      newAvatarUrl,
    ),
    removeOldFile(
      supabase,
      BANNER_BUCKET,
      user.id,
      oldProfile?.banner_url,
      newBannerUrl,
    ),
  ]);

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
      password: [],
      _form: [],
    },
  };
}