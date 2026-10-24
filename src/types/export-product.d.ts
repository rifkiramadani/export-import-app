import { Category } from "./category";
import { Country } from "./country";
import { Currency } from "./currency";
import { Unit } from "./unit";

export interface ExportProduct {
  id: string;
  profile_id: string;
  title: string;
  description: string | null;
  price: number;
  quantity?: number;
  min_order: number;
  whatsapp_number: string;
  image_url?: string | null;
  created_at: string;
  category_id: string;
  country_id: string;
  unit_id: string;
  currency_id: string;
  category?: Category;
  country?: Country;
  unit?: Unit;
  currency?: Currency;
  profile?: {
    name: string;
    company_name: string;
  };
}

export type ExportProductFormState = {
  status: string;
  errors: {
    title?: string[];
    description?: string[];
    price?: string[];
    min_order?: string[];
    whatsapp_number?: string[];
    image_url?: string[];
    category_id?: string[];
    country_id?: string[];
    unit_id?: string[];
    currency_id?: string[];
    quantity?: string[];
    _form: string[];
  };
};