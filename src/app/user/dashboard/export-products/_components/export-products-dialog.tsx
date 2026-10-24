"use client";

import { useState, useTransition } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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

import { ExportProduct, ExportProductFormState } from "@/types/export-product";
import { Category } from "@/types/category";
import { Country } from "@/types/country";
import { Unit } from "@/types/unit";
import { Currency } from "@/types/currency";
import { exportProductSchema } from "@/lib/validations/export-products.schema";
import {
  INITIAL_EXPORT_PRODUCT_FORM,
  INITIAL_STATE_EXPORT_PRODUCT,
} from "@/constants/export-products.constants";
import { upsertProduct } from "../action";

// Tipe nilai di form (sebelum validasi/coerce): price & min_order = unknown
type ExportProductFormInput = z.input<typeof exportProductSchema>;

const BUCKET_NAME = "export_products";

// Dipindah ke luar komponen agar tidak memicu error "impure function" (Date.now)
async function uploadProductImage(
  supabase: SupabaseClient,
  file: File,
  profileId: string,
): Promise<string> {
  const { data: bucketData, error: bucketCheckError } =
    await supabase.storage.getBucket(BUCKET_NAME);
  if (bucketCheckError || !bucketData) {
    await supabase.storage.createBucket(BUCKET_NAME, { public: true });
  }

  const ext = file.name.split(".").pop();
  const path = `${profileId}/${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(path, file, { upsert: true });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(path);
  return data.publicUrl;
}

interface ExportProductDialogProps {
  product?: ExportProduct | null;
  categories: Category[];
  countries: Country[];
  units: Unit[];
  currencies: Currency[];
  profileId: string;
}

export function ExportProductsDialog({
  product,
  categories,
  countries,
  units,
  currencies,
  profileId,
}: ExportProductDialogProps) {
  const [open, setOpen] = useState<boolean>(false);
  const supabase = createClient();

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>(
    product?.image_url ?? "",
  );
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isServerPending, startServerTransition] = useTransition();
  const [state, setState] = useState<ExportProductFormState>(
    INITIAL_STATE_EXPORT_PRODUCT,
  );

  const isEditMode = Boolean(product);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors: formErrors },
  } = useForm<ExportProductFormInput>({
    resolver: zodResolver(
      exportProductSchema,
    ) as unknown as Resolver<ExportProductFormInput>,
    defaultValues: {
      title: product?.title ?? INITIAL_EXPORT_PRODUCT_FORM.title,
      description:
        product?.description ?? INITIAL_EXPORT_PRODUCT_FORM.description,
      price: product?.price
        ? Number(product.price)
        : Number(INITIAL_EXPORT_PRODUCT_FORM.price),
      min_order: product?.min_order
        ? Number(product.min_order)
        : Number(INITIAL_EXPORT_PRODUCT_FORM.min_order),
      whatsapp_number:
        product?.whatsapp_number ?? INITIAL_EXPORT_PRODUCT_FORM.whatsapp_number,
      image_url: product?.image_url ?? INITIAL_EXPORT_PRODUCT_FORM.image_url,
      category_id:
        product?.category_id ?? INITIAL_EXPORT_PRODUCT_FORM.category_id,
      country_id: product?.country_id ?? INITIAL_EXPORT_PRODUCT_FORM.country_id,
      unit_id: product?.unit_id ?? INITIAL_EXPORT_PRODUCT_FORM.unit_id,
      currency_id:
        product?.currency_id ?? INITIAL_EXPORT_PRODUCT_FORM.currency_id,
      quantity: product?.quantity
        ? Number(product.quantity)
        : Number(INITIAL_EXPORT_PRODUCT_FORM.quantity),
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const onSubmit = async (data: ExportProductFormInput) => {
    setIsUploading(true);
    try {
      let finalImageUrl = product?.image_url ?? "";

      if (imageFile) {
        finalImageUrl = await uploadProductImage(
          supabase,
          imageFile,
          profileId,
        );
        setValue("image_url", finalImageUrl, { shouldValidate: true });
      }

      const formData = new FormData();
      formData.append("title", data.title);
      formData.append("description", data.description ?? "");
      formData.append("price", String(Number(data.price)));
      formData.append("min_order", String(Number(data.min_order)));
      formData.append("whatsapp_number", data.whatsapp_number);
      formData.append("image_url", finalImageUrl);
      formData.append("category_id", data.category_id);
      formData.append("country_id", data.country_id);
      formData.append("unit_id", data.unit_id);
      formData.append("currency_id", data.currency_id);
      formData.append("quantity", String(Number(data.quantity)));

      startServerTransition(async () => {
        const result = await upsertProduct(
          product?.id ?? null,
          state,
          formData,
        );
        setState(result);

        if (result?.status === "success") {
          toast.success(
            isEditMode
              ? "Product updated successfully!"
              : "Product created successfully!",
          );
          setOpen(false);
          if (!isEditMode) reset();
        } else if (result?.status === "error" && result.errors?._form?.[0]) {
          toast.error("Operation Failed", {
            description: result.errors._form[0],
          });
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
          <Plus size={16} /> Add Product
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-white text-slate-900 shadow-2xl max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              {isEditMode ? "Edit Export Product" : "Add New Export Product"}
            </DialogTitle>
            <DialogDescription className="text-slate-500 text-sm">
              Fill in the details below to list your product on the global
              market.
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-4 pt-2" onSubmit={handleSubmit(onSubmit)}>
            <input type="hidden" {...register("image_url")} />

            <div className="space-y-2">
              <Label>Product Image</Label>
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
                <Label htmlFor="title">Product Title</Label>
                <Input
                  {...register("title")}
                  id="title"
                  placeholder="e.g. Premium Robusta Coffee"
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <Label htmlFor="price">Price</Label>
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
                <Label htmlFor="min_order">Minimum Order</Label>
                <Input
                  {...register("min_order")}
                  id="min_order"
                  type="number"
                  placeholder="1"
                />
                {formErrors.min_order?.message && (
                  <span className="text-xs text-red-500">
                    {formErrors.min_order.message}
                  </span>
                )}
              </div>
              <div className="space-y-1">
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  {...register("quantity")}
                  id="quantity"
                  type="number"
                  placeholder="0"
                />
                {formErrors.quantity?.message && (
                  <span className="text-xs text-red-500">
                    {formErrors.quantity.message}
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
                placeholder="Product description..."
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
                "Update Product"
              ) : (
                "Save Product"
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
