export interface Country {
  id: string;
  name: string;
  code: string;
  created_at?: string;
}

export type CountryFormState = {
  status: "idle" | "success" | "error";
  errors: {
    name?: string[];
    code?: string[];
    _form?: string[];
  };
};