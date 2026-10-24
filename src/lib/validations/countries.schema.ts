import { z } from "zod";

export const countrySchema = z.object({
  name: z.string().min(2, "Country name must be at least 2 characters"),
  code: z
    .string()
    .min(2, "Country code must be at least 2 characters (e.g. ID, US)"),
});

export type CountryForm = z.infer<typeof countrySchema>;
