export interface Profile {
  id: string;
  name: string | null;
  company_name: string | null;
  role: "admin" | "user";
  avatar_url: string | null;
  banner_url: string | null;
  created_at: string;
}

export type UserFormState = {
  status: "idle" | "success" | "error";
  errors: {
    name?: string[];
    company_name?: string[];
    role?: string[];
    avatar_url?: string[];
    banner_url?: string[];
    _form?: string[];
  };
};
