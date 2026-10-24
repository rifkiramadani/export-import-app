import { Category } from "./category";
import { Country } from "./country";
import { Currency } from "./currency";
import { Unit } from "./unit";

export interface ImportRequest {
  id: string;
  profile_id: string;
  title: string;
  description: string | null;
  price: number;
  target_quantity: number;
  whatsapp_number: string;
  image_url?: string | null;
  created_at: string;

  // foreign key (dipakai dialog untuk defaultValues)
  category_id: string;
  country_id: string;
  unit_id: string;
  currency_id: string;

  // relasi hasil join (opsional)
  category?: Category;
  country?: Country;
  unit?: Unit;
  currency?: Currency;
  profile?: {
    name: string;
    company_name: string;
  };
}

export type ImportRequestFormState = {
  status: string;
  errors: {
    title?: string[];
    description?: string[];
    price?: string[];
    target_quantity?: string[];
    whatsapp_number?: string[];
    image_url?: string[];
    category_id?: string[];
    country_id?: string[];
    unit_id?: string[];
    currency_id?: string[];
    _form: string[];
  };
};