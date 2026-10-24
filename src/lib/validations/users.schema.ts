import { z } from "zod";

export const userSchema = z.object({
  name: z.string().min(1, "Name is required"),
  company_name: z.string().optional().nullable(),
  role: z.enum(["admin", "user"]),
  avatar_url: z.string().optional().nullable(),
  banner_url: z.string().optional().nullable(),
});

export type UserForm = z.infer<typeof userSchema>;
