import { z } from "zod";

export const unitSchema = z.object({
  name: z.string().min(1, "Unit name is required"),
});

export type UnitForm = z.infer<typeof unitSchema>;