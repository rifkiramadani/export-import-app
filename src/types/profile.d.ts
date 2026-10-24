import { Country } from "./country";

export interface Profile {
  id: string;
  role: "admin" | "user";
  name: string | null;
  company_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  banner_url: string | null;
  country_id: string | null;
  whatsapp: string | null;
  password: string | null;
  created_at: string;
  country?: Country | null;
}

export type ProfileFormState = {
  status?: string;
  errors?: {
    name?: string[];
    company_name?: string[];
    bio?: string[];
    avatar_url?: string[];
    banner_url?: string[];
    country_id?: string[];
    whatsapp?: string[];
    password?: string[];
    _form?: string[];
  };
};
