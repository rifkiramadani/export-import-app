import { z } from "zod";

export const profileSchema = z.object({
  name: z.string().min(3, "Name Must Within 3 Character"),
  company_name: z.string().optional(),
  bio: z.string().optional(),
  avatar_url: z
    .string()
    .pipe(z.url("File Format For Avatar Is Not Valid"))
    .optional()
    .or(z.literal("")),
  banner_url: z
    .string()
    .pipe(z.url("File Format For Banner Is Not Valid"))
    .optional()
    .nullable()
    .or(z.literal("")),
  country_id: z
    .union([z.literal(""), z.uuid("Country Format Is Not Valid")])
    .optional()
    .nullable(),
  whatsapp: z.string().optional(),
});

export type ProfileForm = z.infer<typeof profileSchema>;
