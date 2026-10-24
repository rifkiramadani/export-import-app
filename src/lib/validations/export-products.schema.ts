import { z } from "zod";

export const exportProductSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  price: z.coerce.number().min(0, "Price must be a positive number"),
  min_order: z.coerce.number().min(1, "Minimum order must be at least 1"),
  category_id: z.string().min(1, "Invalid category"),
  country_id: z.string().min(1, "Invalid country"),
  unit_id: z.string().min(1, "Invalid unit"),
  currency_id: z.string().min(1, "Invalid currency"),
  quantity: z.coerce.number().int().min(0, "Quantity must be 0 or more"),
  whatsapp_number: z.string().min(5, "WhatsApp number is required"),
  image_url: z.string().optional().nullable(),
});

export type ExportProductForm = z.infer<typeof exportProductSchema>;
