"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import { INITIAL_STATE_PROFILE } from "@/constants/profile.constants";
import { profileSchema, ProfileForm } from "@/lib/validations/profile.schema";
import { Country } from "@/types/country";
import { Profile } from "@/types/profile";
import { zodResolver } from "@hookform/resolvers/zod";
import { startTransition, useActionState, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { updateProfile } from "../action";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { UploadCloud } from "lucide-react";
import type { SupabaseClient } from "@supabase/supabase-js";

interface IProfileProps {
  profile: Profile;
  countries: Country[];
}

// Helper di luar komponen (bukan saat render), jadi Date.now() aman dipakai.
// Path file harus diawali folder <user-id>/ agar cocok dengan policy storage.
async function uploadImage(
  supabase: SupabaseClient,
  bucket: string,
  userId: string,
  file: File,
): Promise<string> {
  const ext = file.name.split(".").pop();
  const path = `${userId}/${Date.now()}.${ext}`;

  const { error } = await supabase.storage.from(bucket).upload(path, file);
  if (error) throw error;

  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}

const ProfileUser = ({ countries, profile }: IProfileProps) => {
  const supabase = createClient();
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // File asli yang dipilih user, baru diupload saat tombol Save ditekan
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);

  // Preview gambar di UI
  const [avatarPreview, setAvatarPreview] = useState<string>(
    profile.avatar_url ?? "",
  );
  const [bannerPreview, setBannerPreview] = useState<string>(
    profile.banner_url ?? "",
  );

  const {
    register,
    handleSubmit,
    formState: { errors: formErrors },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: profile.name ?? "",
      company_name: profile.company_name ?? "",
      bio: profile.bio ?? "",
      avatar_url: profile.avatar_url ?? "",
      banner_url: profile.banner_url ?? "",
      country_id: profile.country_id ?? "",
      whatsapp: profile.whatsapp ?? "",
    },
  });

  const [state, formAction, isPending] = useActionState(
    updateProfile,
    INITIAL_STATE_PROFILE,
  );

  // Saat file dipilih: hanya buat preview lokal, belum upload
  const handleFileSelect = (
    e: React.ChangeEvent<HTMLInputElement>,
    setFile: React.Dispatch<React.SetStateAction<File | null>>,
    setPreview: React.Dispatch<React.SetStateAction<string>>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFile(file);
    setPreview(URL.createObjectURL(file));
  };

  // Saat Save: upload gambar (jika ada yang baru), lalu kirim data ke server action
  const onSubmit = async (data: ProfileForm) => {
    setIsSubmitting(true);
    try {
      let finalAvatarUrl = profile.avatar_url ?? "";
      let finalBannerUrl = profile.banner_url ?? "";

      if (avatarFile) {
        finalAvatarUrl = await uploadImage(
          supabase,
          "profiles",
          profile.id,
          avatarFile,
        );
      }
      if (bannerFile) {
        finalBannerUrl = await uploadImage(
          supabase,
          "banners",
          profile.id,
          bannerFile,
        );
      }

      const formData = new FormData();
      formData.append("name", data.name);
      formData.append("company_name", data.company_name ?? "");
      formData.append("bio", data.bio ?? "");
      formData.append("whatsapp", data.whatsapp ?? "");
      formData.append("country_id", data.country_id ?? "");
      formData.append("avatar_url", finalAvatarUrl);
      formData.append("banner_url", finalBannerUrl);

      startTransition(() => {
        formAction(formData);
      });
    } catch (err: unknown) {
      toast.error("Upload failed", {
        description:
          err instanceof Error ? err.message : "An unknown error occurred",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toaster feedback
  useEffect(() => {
    if (state?.status === "error" && state.errors?._form?.[0]) {
      toast.error("Update Failed", {
        description: state.errors._form[0],
      });
    } else if (state?.status === "success") {
      toast.success("Profile Updated Successfully!");
    }
  }, [state]);

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-slate-900">Your Profile</h1>
        <p className="text-slate-600 font-light">
          Manage your account settings, company identity, and public profile
          view.
        </p>
      </div>

      <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
        {/* Banner (bucket: banners) */}
        <div className="flex flex-col gap-2">
          <Label className="font-light">Profile Banner Preview</Label>
          <div className="relative w-full h-48 rounded-xl overflow-hidden bg-gray-700 border border-gray-600 flex items-center justify-center shadow-md">
            {bannerPreview ? (
              <Image
                src={bannerPreview}
                alt="Banner Preview"
                fill
                unoptimized
                className="object-cover"
              />
            ) : (
              <span className="text-gray-400 text-sm">
                No Banner Image Uploaded
              </span>
            )}
          </div>
          <div className="flex justify-end mt-1">
            <label className="cursor-pointer bg-gray-700 hover:bg-gray-500 text-white px-4 py-2 rounded-md text-sm flex items-center gap-2 transition-all">
              <UploadCloud size={16} />
              Choose Banner Image
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) =>
                  handleFileSelect(e, setBannerFile, setBannerPreview)
                }
              />
            </label>
          </div>
          {formErrors.banner_url?.message && (
            <span className="text-xs text-red-500">
              {formErrors.banner_url.message}
            </span>
          )}
        </div>

        {/* Avatar & identitas utama (bucket: profiles) */}
        <div className="flex flex-col md:flex-row gap-6 items-start">
          <div className="flex flex-col items-center gap-2">
            <Label className="font-light">Avatar</Label>
            <div className="relative w-28 h-28 rounded-full overflow-hidden bg-gray-700 border border-gray-600 flex items-center justify-center shadow-md">
              {avatarPreview ? (
                <Image
                  src={avatarPreview}
                  alt="Avatar Preview"
                  fill
                  unoptimized
                  className="object-cover"
                />
              ) : (
                <span className="text-gray-400 text-2xl font-bold">
                  {profile.name?.[0]?.toUpperCase() || "U"}
                </span>
              )}
            </div>
            <label className="cursor-pointer bg-gray-700 hover:bg-gray-500 text-white px-3 py-1.5 rounded-md text-xs flex items-center gap-1 mt-1 transition-all">
              <UploadCloud size={14} />
              Choose Avatar
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) =>
                  handleFileSelect(e, setAvatarFile, setAvatarPreview)
                }
              />
            </label>
          </div>

          <div className="flex-1 w-full space-y-4">
            <div className="flex flex-row gap-4">
              <div className="flex flex-col gap-2 w-full">
                <Label htmlFor="name" className="font-light">
                  Name
                </Label>
                <Input
                  {...register("name")}
                  id="name"
                  type="text"
                  placeholder="Input Your Name"
                  className={cn(
                    "bg-gray-700 text-white placeholder:text-gray-400",
                    (formErrors.name || state?.errors?.name?.[0]) &&
                      "ring-2 ring-red-500",
                  )}
                />
                {(formErrors.name?.message || state?.errors?.name?.[0]) && (
                  <span className="text-xs text-red-500">
                    {formErrors.name?.message || state?.errors?.name?.[0]}
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-2 w-full">
                <Label htmlFor="company_name" className="font-light">
                  Company Name
                </Label>
                <Input
                  {...register("company_name")}
                  id="company_name"
                  type="text"
                  placeholder="Input Company Name"
                  className={cn(
                    "bg-gray-700 text-white placeholder:text-gray-400",
                    (formErrors.company_name ||
                      state?.errors?.company_name?.[0]) &&
                      "ring-2 ring-red-500",
                  )}
                />
                {(formErrors.company_name?.message ||
                  state?.errors?.company_name?.[0]) && (
                  <span className="text-xs text-red-500">
                    {formErrors.company_name?.message ||
                      state?.errors?.company_name?.[0]}
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-row gap-4">
              <div className="flex flex-col gap-2 w-full">
                <Label htmlFor="whatsapp" className="font-light">
                  WhatsApp Number
                </Label>
                <Input
                  {...register("whatsapp")}
                  id="whatsapp"
                  type="text"
                  placeholder="e.g. 628123456789"
                  className={cn(
                    "bg-gray-700 text-white placeholder:text-gray-400",
                    (formErrors.whatsapp || state?.errors?.whatsapp?.[0]) &&
                      "ring-2 ring-red-500",
                  )}
                />
                {(formErrors.whatsapp?.message ||
                  state?.errors?.whatsapp?.[0]) && (
                  <span className="text-xs text-red-500">
                    {formErrors.whatsapp?.message ||
                      state?.errors?.whatsapp?.[0]}
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-2 w-full">
                <Label htmlFor="country_id" className="font-light">
                  Country
                </Label>
                <select
                  {...register("country_id")}
                  id="country_id"
                  className={cn(
                    "bg-gray-700 text-white flex h-9 w-full rounded-md border border-input appearance-none px-3 py-1 text-base shadow-sm",
                    (formErrors.country_id || state?.errors?.country_id?.[0]) &&
                      "ring-2 ring-red-500",
                  )}
                >
                  <option value="" className="text-gray-400">
                    Choose Your Country
                  </option>
                  {countries.map((country: Country) => (
                    <option value={country.id} key={country.id}>
                      {country.name} ({country.code})
                    </option>
                  ))}
                </select>
                {(formErrors.country_id?.message ||
                  state?.errors?.country_id?.[0]) && (
                  <span className="text-xs text-red-500">
                    {formErrors.country_id?.message ||
                      state?.errors?.country_id?.[0]}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="bio" className="font-light">
            Bio / Company Description
          </Label>
          <Textarea
            {...register("bio")}
            id="bio"
            rows={4}
            placeholder="Input Bio / Company Description"
            className={cn(
              "bg-gray-700 text-white placeholder:text-gray-400",
              (formErrors.bio || state?.errors?.bio?.[0]) &&
                "ring-2 ring-red-500",
            )}
          />
          {(formErrors.bio?.message || state?.errors?.bio?.[0]) && (
            <span className="text-xs text-red-500">
              {formErrors.bio?.message || state?.errors?.bio?.[0]}
            </span>
          )}
        </div>

        <Button
          className="w-full bg-gray-700 hover:bg-gray-500 text-white py-2.5 transition-all"
          type="submit"
          disabled={isPending || isSubmitting}
        >
          {isPending || isSubmitting ? <Spinner /> : "Save Profile Changes"}
        </Button>
      </form>
    </div>
  );
};

export default ProfileUser;
