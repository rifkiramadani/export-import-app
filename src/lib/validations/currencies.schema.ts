import { z } from "zod";

export const currencySchema = z.object({
  name: z.string().min(2, "Currency name must be at least 2 characters"),
  code: z.string().min(2, "Currency code must be at least 2 characters (e.g. USD, IDR)"),
  symbol: z.string().min(1, "Currency symbol is required (e.g. $, Rp)"),
});

export type CurrencyForm = z.infer<typeof currencySchema>;