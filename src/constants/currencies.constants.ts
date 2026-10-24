import { CurrencyFormState } from "@/types/currency";

export const INITIAL_CURRENCY_FORM = {
  name: "",
  code: "",
  symbol: "",
};

export const INITIAL_STATE_CURRENCY: CurrencyFormState = {
  status: "idle",
  errors: {
    name: [],
    code: [],
    symbol: [],
    _form: [],
  },
};