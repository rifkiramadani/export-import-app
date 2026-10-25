import { Category } from "./category";
import { Country } from "./country";
import { Currency } from "./currency";
import { Profile } from "./profile";
import { Unit } from "./unit";

export interface MarketItem {
  id: string;
  user_id: string;
  type: "export" | "import";
  title: string;
  description: string | null;
  price: number | string;
  currency_id: string | null;
  unit_id: string | null;
  category_id: string | null;
  country_id: string | null;
  min_order?: number | string | null;
  target_quantity?: number | string | null;
  whatsapp_number: string | null;
  image_url: string | null;
  created_at: string;

  // Relasi tabel
  category?: Category | null;
  country?: Country | null;
  currency?: Currency | null;
  unit?: Unit | null;
  profile?: Profile | null;
}
