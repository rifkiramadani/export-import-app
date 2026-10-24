export interface Unit {
  id: string;
  name: string;
  created_at?: string;
}

export type UnitFormState = {
  status: "idle" | "success" | "error";
  errors: {
    name?: string[];
    _form?: string[];
  };
};