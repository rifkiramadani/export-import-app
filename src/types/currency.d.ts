export interface Currency {
  id: string;
  name: string;
  code: string;
  symbol: string;
  created_at?: string;
}

export type CurrencyFormState = {
  status: "idle" | "success" | "error";
  errors: {
    name?: string[];
    code?: string[];
    symbol?: string[];
    _form?: string[];
  };
};