import { CountryFormState } from "@/types/country";

export const INITIAL_COUNTRY_FORM = {
  name: "",
  code: "",
};

export const INITIAL_STATE_COUNTRY: CountryFormState = {
  status: "idle",
  errors: {
    name: [],
    code: [],
    _form: [],
  },
};
