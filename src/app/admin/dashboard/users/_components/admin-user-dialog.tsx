"use client";

import { useState, useTransition } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import Image from "next/image";
import { UploadCloud, Edit2 } from "lucide-react";
import type { SupabaseClient } from "@supabase/supabase-js";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase/client";

import { Profile, UserFormState } from "@/types/user";
import { userSchema, UserForm } from "@/lib/validations/users.schema";
import {
  INITIAL_USER_FORM,
  INITIAL_STATE_USER,
} from "@/constants/users.constants";
import { adminUpsertUser } from "../action";

const BUCKET_NAME = "profiles";

function getStoragePathFromUrl(url: string): string | null {
  const marker = `/storage/v1/object/public/${BUCKET_NAME}/`;
  const index = url.indexOf(marker);
  if (index === -1) return null;
  return decodeURIComponent(url.slice(index + marker.length).split("?")[0]);
}

async function uploadProfileImage(
  supabase: SupabaseClient,
  file: File,
  userId: string,
  type: "avatar" | "banner",
): Promise<string> {
  const ext = file.name.split(".").pop();
  const path = `${userId}/${type}-${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(path, file);

  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(path);
  return data.publicUrl;
}

async function removeProfileImage(
  supabase: SupabaseClient,
  imageUrl?: string | null,
): Promise<void> {
  if (!imageUrl) return;
  const path = getStoragePathFromUrl(imageUrl);
  if (!path) return;

  const { error } = await supabase.storage.from(BUCKET_NAME).remove([path]);
  if (error) console.error("Gagal menghapus file:", error.message);
}

interface AdminUserDialogProps {
  user: Profile;
}

export function AdminUserDialog({ user }: AdminUserDialogProps) {
  const [open, setOpen] = useState<boolean>(false);
  const supabase = createClient();
  const queryClient = useQueryClient();

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>(
    user.avatar_url ?? "",
  );

  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string>(
    user.banner_url ?? "",
  );

  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isServerPending, startServerTransition] = useTransition();
  const [state, setState] = useState<UserFormState>(INITIAL_STATE_USER);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors: formErrors },
  } = useForm<UserForm>({
    resolver: zodResolver(userSchema) as unknown as Resolver<UserForm>,
    defaultValues: {
      name: user.name ?? INITIAL_USER_FORM.name,
      company_name: user.company_name ?? INITIAL_USER_FORM.company_name,
      role: user.role ?? INITIAL_USER_FORM.role,
      avatar_url: user.avatar_url ?? INITIAL_USER_FORM.avatar_url,
      banner_url: user.banner_url ?? INITIAL_USER_FORM.banner_url,
    },
  });

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleBannerSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBannerFile(file);
    setBannerPreview(URL.createObjectURL(file));
  };

  const onSubmit = async (data: UserForm) => {
    setIsUploading(true);
    try {
      const oldAvatarUrl = user.avatar_url;
      const oldBannerUrl = user.banner_url;

      let finalAvatarUrl = oldAvatarUrl ?? "";
      let finalBannerUrl = oldBannerUrl ?? "";

      let uploadedNewAvatar = false;
      let uploadedNewBanner = false;

      if (avatarFile) {
        finalAvatarUrl = await uploadProfileImage(
          supabase,
          avatarFile,
          user.id,
          "avatar",
        );
        uploadedNewAvatar = true;
        setValue("avatar_url", finalAvatarUrl, { shouldValidate: true });
      }

      if (bannerFile) {
        finalBannerUrl = await uploadProfileImage(
          supabase,
          bannerFile,
          user.id,
          "banner",
        );
        uploadedNewBanner = true;
        setValue("banner_url", finalBannerUrl, { shouldValidate: true });
      }

      const formData = new FormData();
      formData.append("name", data.name);
      formData.append("company_name", data.company_name ?? "");
      formData.append("role", data.role);
      formData.append("avatar_url", finalAvatarUrl);
      formData.append("banner_url", finalBannerUrl);

      startServerTransition(async () => {
        const result = await adminUpsertUser(user.id, state, formData);
        setState(result);

        if (result?.status === "success") {
          if (uploadedNewAvatar && oldAvatarUrl) {
            await removeProfileImage(supabase, oldAvatarUrl);
          }
          if (uploadedNewBanner && oldBannerUrl) {
            await removeProfileImage(supabase, oldBannerUrl);
          }

          setAvatarFile(null);
          setBannerFile(null);

          toast.success("User updated successfully (Admin)!");
          setOpen(false);

          await queryClient.invalidateQueries({
            queryKey: ["admin-users"],
          });
        } else {
          if (uploadedNewAvatar)
            await removeProfileImage(supabase, finalAvatarUrl);
          if (uploadedNewBanner)
            await removeProfileImage(supabase, finalBannerUrl);

          if (result?.status === "error" && result.errors?._form?.[0]) {
            toast.error("Operation Failed", {
              description: result.errors._form[0],
            });
          }
        }
      });
    } catch (err: unknown) {
      toast.error("Image upload failed", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-slate-500 hover:text-slate-900"
        onClick={() => setOpen(true)}
      >
        <Edit2 size={16} />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-white text-slate-900 shadow-2xl max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              Edit User Profile (Admin)
            </DialogTitle>
            <DialogDescription className="text-slate-500 text-sm">
              Manage user details, role, avatar, and banner images.
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-4 pt-2" onSubmit={handleSubmit(onSubmit)}>
            <input type="hidden" {...register("avatar_url")} />
            <input type="hidden" {...register("banner_url")} />

            {/* Banner Preview & Upload */}
            <div className="space-y-2">
              <Label>User Banner</Label>
              <div className="relative w-full h-32 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center">
                {bannerPreview ? (
                  <Image
                    src={bannerPreview}
                    alt="Banner Preview"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <span className="text-slate-400 text-sm">No Banner</span>
                )}
              </div>
              <label className="cursor-pointer inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-md text-xs font-medium transition-colors">
                <UploadCloud size={14} /> Choose Banner
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleBannerSelect}
                />
              </label>
            </div>

            {/* Avatar Preview & Upload */}
            <div className="space-y-2">
              <Label>User Avatar</Label>
              <div className="relative w-20 h-20 rounded-full overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center">
                {avatarPreview ? (
                  <Image
                    src={avatarPreview}
                    alt="Avatar Preview"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <span className="text-slate-400 text-xs">No Avatar</span>
                )}
              </div>
              <label className="cursor-pointer inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-md text-xs font-medium transition-colors">
                <UploadCloud size={14} /> Choose Avatar
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarSelect}
                />
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  {...register("name")}
                  id="name"
                  placeholder="e.g. John Doe"
                />
                {formErrors.name?.message && (
                  <span className="text-xs text-red-500">
                    {formErrors.name.message}
                  </span>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="company_name">Company Name</Label>
                <Input
                  {...register("company_name")}
                  id="company_name"
                  placeholder="e.g. PT Maju Bersama"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="role">User Role</Label>
              <select
                {...register("role")}
                id="role"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
              {formErrors.role?.message && (
                <span className="text-xs text-red-500">
                  {formErrors.role.message}
                </span>
              )}
            </div>

            <Button
              type="submit"
              className="w-full bg-slate-900 hover:bg-slate-800 text-white"
              disabled={isServerPending || isUploading}
            >
              {isServerPending || isUploading ? <Spinner /> : "Update User"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
