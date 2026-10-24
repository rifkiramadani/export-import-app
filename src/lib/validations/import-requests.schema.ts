import { z } from "zod";

export const importRequestSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  price: z.coerce.number().min(0, "Price must be a positive number"),
  target_quantity: z.coerce
    .number()
    .min(1, "Target quantity must be at least 1"),
  whatsapp_number: z.string().min(5, "WhatsApp number is required"),
  image_url: z.string().optional().nullable(),
  category_id: z.string().min(1, "Invalid category"),
  country_id: z.string().min(1, "Invalid country"),
  unit_id: z.string().min(1, "Invalid unit"),
  currency_id: z.string().min(1, "Invalid currency"),
});

export type ImportRequestForm = z.infer<typeof importRequestSchema>;
