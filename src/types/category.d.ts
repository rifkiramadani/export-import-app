export interface Category {
  id: string;
  name: string;
  slug: string;
  created_at?: string;
}

export type CategoryFormState = {
  status: "idle" | "success" | "error";
  errors: {
    name?: string[];
    slug?: string[];
    _form?: string[];
  };
};