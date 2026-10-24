"use client";

import { useState, useTransition } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { toast } from "sonner";
import Image from "next/image";
import { UploadCloud, Plus, Edit2 } from "lucide-react";
import type { SupabaseClient } from "@supabase/supabase-js";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase/client";

import { ImportRequest, ImportRequestFormState } from "@/types/import-request";
import { Category } from "@/types/category";
import { Country } from "@/types/country";
import { Unit } from "@/types/unit";
import { Currency } from "@/types/currency";
import { importRequestSchema } from "@/lib/validations/import-requests.schema";
import {
  INITIAL_IMPORT_REQUEST_FORM,
  INITIAL_STATE_IMPORT_REQUEST,
} from "@/constants/import-requests.constants";
import { upsertImportRequest } from "../action";

type ImportRequestFormInput = z.input<typeof importRequestSchema>;

const BUCKET_NAME = "import_requests";

function getStoragePathFromUrl(url: string): string | null {
  const marker = `/storage/v1/object/public/${BUCKET_NAME}/`;
  const index = url.indexOf(marker);
  if (index === -1) return null;
  return decodeURIComponent(url.slice(index + marker.length).split("?")[0]);
}

async function uploadImportImage(
  supabase: SupabaseClient,
  file: File,
  profileId: string,
): Promise<string> {
  const ext = file.name.split(".").pop();
  const path = `${profileId}/${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(path, file);

  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(path);
  return data.publicUrl;
}

async function removeImportImage(
  supabase: SupabaseClient,
  imageUrl?: string | null,
): Promise<void> {
  if (!imageUrl) return;
  const path = getStoragePathFromUrl(imageUrl);
  if (!path) return;

  const { error } = await supabase.storage.from(BUCKET_NAME).remove([path]);
  if (error) console.error("Gagal menghapus gambar:", error.message);
}

interface ImportRequestDialogProps {
  request?: ImportRequest | null;
  categories: Category[];
  countries: Country[];
  units: Unit[];
  currencies: Currency[];
  profileId: string;
}

export function ImportRequestsDialog({
  request,
  categories,
  countries,
  units,
  currencies,
  profileId,
}: ImportRequestDialogProps) {
  const [open, setOpen] = useState<boolean>(false);
  const supabase = createClient();
  const queryClient = useQueryClient();

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>(
    request?.image_url ?? "",
  );
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isServerPending, startServerTransition] = useTransition();
  const [state, setState] = useState<ImportRequestFormState>(
    INITIAL_STATE_IMPORT_REQUEST,
  );

  const isEditMode = Boolean(request);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors: formErrors },
  } = useForm<ImportRequestFormInput>({
    resolver: zodResolver(
      importRequestSchema,
    ) as unknown as Resolver<ImportRequestFormInput>,
    defaultValues: {
      title: request?.title ?? INITIAL_IMPORT_REQUEST_FORM.title,
      description:
        request?.description ?? INITIAL_IMPORT_REQUEST_FORM.description,
      price: request?.price
        ? Number(request.price)
        : Number(INITIAL_IMPORT_REQUEST_FORM.price),
      target_quantity: request?.target_quantity
        ? Number(request.target_quantity)
        : Number(INITIAL_IMPORT_REQUEST_FORM.target_quantity),
      whatsapp_number:
        request?.whatsapp_number ?? INITIAL_IMPORT_REQUEST_FORM.whatsapp_number,
      image_url: request?.image_url ?? INITIAL_IMPORT_REQUEST_FORM.image_url,
      category_id:
        request?.category_id ?? INITIAL_IMPORT_REQUEST_FORM.category_id,
      country_id: request?.country_id ?? INITIAL_IMPORT_REQUEST_FORM.country_id,
      unit_id: request?.unit_id ?? INITIAL_IMPORT_REQUEST_FORM.unit_id,
      currency_id:
        request?.currency_id ?? INITIAL_IMPORT_REQUEST_FORM.currency_id,
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const onSubmit = async (data: ImportRequestFormInput) => {
    setIsUploading(true);
    try {
      const oldImageUrl = request?.image_url ?? null;
      let finalImageUrl = oldImageUrl ?? "";
      let uploadedNewImage = false;

      // 1. Upload gambar baru lebih dulu (gambar lama belum disentuh)
      if (imageFile) {
        finalImageUrl = await uploadImportImage(supabase, imageFile, profileId);
        uploadedNewImage = true;
        setValue("image_url", finalImageUrl, { shouldValidate: true });
      }

      const formData = new FormData();
      formData.append("title", data.title);
      formData.append("description", data.description ?? "");
      formData.append("price", String(Number(data.price)));
      formData.append("target_quantity", String(Number(data.target_quantity)));
      formData.append("whatsapp_number", data.whatsapp_number);
      formData.append("image_url", finalImageUrl);
      formData.append("category_id", data.category_id);
      formData.append("country_id", data.country_id);
      formData.append("unit_id", data.unit_id);
      formData.append("currency_id", data.currency_id);

      startServerTransition(async () => {
        const result = await upsertImportRequest(
          request?.id ?? null,
          state,
          formData,
        );
        setState(result);

        if (result?.status === "success") {
          // 2. Simpan sukses -> baru hapus gambar lama
          if (uploadedNewImage && oldImageUrl) {
            await removeImportImage(supabase, oldImageUrl);
          }
          setImageFile(null);

          toast.success(
            isEditMode
              ? "Import request updated successfully!"
              : "Import request created successfully!",
          );
          setOpen(false);
          if (!isEditMode) {
            reset();
            setImagePreview("");
          }

          // 3. Segarkan cache tabel
          await queryClient.invalidateQueries({
            queryKey: ["import-requests"],
          });
        } else {
          // Simpan gagal -> rollback gambar baru agar tidak jadi file yatim
          if (uploadedNewImage) {
            await removeImportImage(supabase, finalImageUrl);
          }
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
      {isEditMode ? (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-slate-500 hover:text-slate-900"
          onClick={() => setOpen(true)}
        >
          <Edit2 size={16} />
        </Button>
      ) : (
        <Button
          className="bg-slate-900 hover:bg-slate-800 text-white gap-2"
          onClick={() => setOpen(true)}
        >
          <Plus size={16} /> Add Import Request
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-white text-slate-900 shadow-2xl max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              {isEditMode ? "Edit Import Request" : "Add New Import Request"}
            </DialogTitle>
            <DialogDescription className="text-slate-500 text-sm">
              Fill in the details below to publish your import request.
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-4 pt-2" onSubmit={handleSubmit(onSubmit)}>
            <input type="hidden" {...register("image_url")} />

            <div className="space-y-2">
              <Label>Request Image</Label>
              <div className="relative w-full h-40 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center">
                {imagePreview ? (
                  <Image
                    src={imagePreview}
                    alt="Preview"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <span className="text-slate-400 text-sm">
                    No Image Selected
                  </span>
                )}
              </div>
              <label className="cursor-pointer inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-md text-xs font-medium transition-colors">
                <UploadCloud size={14} /> Choose Image
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileSelect}
                />
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="title">Request Title</Label>
                <Input
                  {...register("title")}
                  id="title"
                  placeholder="e.g. Raw Cashew Nuts Required"
                />
                {formErrors.title?.message && (
                  <span className="text-xs text-red-500">
                    {formErrors.title.message}
                  </span>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="whatsapp_number">WhatsApp Number</Label>
                <Input
                  {...register("whatsapp_number")}
                  id="whatsapp_number"
                  placeholder="e.g. 628123456789"
                />
                {formErrors.whatsapp_number?.message && (
                  <span className="text-xs text-red-500">
                    {formErrors.whatsapp_number.message}
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="price">Target Price / Budget</Label>
                <Input
                  {...register("price")}
                  id="price"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                />
                {formErrors.price?.message && (
                  <span className="text-xs text-red-500">
                    {formErrors.price.message}
                  </span>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="target_quantity">Target Quantity</Label>
                <Input
                  {...register("target_quantity")}
                  id="target_quantity"
                  type="number"
                  placeholder="1"
                />
                {formErrors.target_quantity?.message && (
                  <span className="text-xs text-red-500">
                    {formErrors.target_quantity.message}
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="category_id">Category</Label>
                <select
                  {...register("category_id")}
                  id="category_id"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                >
                  <option value="">Select Category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                {formErrors.category_id?.message && (
                  <span className="text-xs text-red-500">
                    {formErrors.category_id.message}
                  </span>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="country_id">Country</Label>
                <select
                  {...register("country_id")}
                  id="country_id"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                >
                  <option value="">Select Country</option>
                  {countries.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.code})
                    </option>
                  ))}
                </select>
                {formErrors.country_id?.message && (
                  <span className="text-xs text-red-500">
                    {formErrors.country_id.message}
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="unit_id">Unit</Label>
                <select
                  {...register("unit_id")}
                  id="unit_id"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                >
                  <option value="">Select Unit</option>
                  {units.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
                {formErrors.unit_id?.message && (
                  <span className="text-xs text-red-500">
                    {formErrors.unit_id.message}
                  </span>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="currency_id">Currency</Label>
                <select
                  {...register("currency_id")}
                  id="currency_id"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                >
                  <option value="">Select Currency</option>
                  {currencies.map((curr) => (
                    <option key={curr.id} value={curr.id}>
                      {curr.code} ({curr.symbol})
                    </option>
                  ))}
                </select>
                {formErrors.currency_id?.message && (
                  <span className="text-xs text-red-500">
                    {formErrors.currency_id.message}
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="description">Description</Label>
              <Textarea
                {...register("description")}
                id="description"
                rows={3}
                placeholder="Request description..."
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-slate-900 hover:bg-slate-800 text-white"
              disabled={isServerPending || isUploading}
            >
              {isServerPending || isUploading ? (
                <Spinner />
              ) : isEditMode ? (
                "Update Import Request"
              ) : (
                "Save Import Request"
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}