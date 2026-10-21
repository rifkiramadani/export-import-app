import { Category } from "./category";
import { Country } from "./country";
import { Currency } from "./currency";
import { Unit } from "./unit";

export interface ExportProduct {
  id: string;
  profile_id: string;
  title: string;
  description: string;
  price: number;
  quantity: number;
  min_order: number;
  whatsapp_number: string;
  image_url?: string;
  created_at: string;
  category: Category;
  country: Country;
  unit: Unit;
  currency: Currency;
  profile: {
    name: string;
    company_name: string;
  };
}
