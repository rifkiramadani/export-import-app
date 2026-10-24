import { ImportRequestFormState } from "@/types/import-request";

export const INITIAL_IMPORT_REQUEST_FORM = {
  title: "",
  description: "",
  price: "",
  target_quantity: "",
  whatsapp_number: "",
  image_url: "",
  category_id: "",
  country_id: "",
  unit_id: "",
  currency_id: "",
};

export const INITIAL_STATE_IMPORT_REQUEST: ImportRequestFormState = {
  status: "idle",
  errors: {
    title: [],
    description: [],
    price: [],
    target_quantity: [],
    whatsapp_number: [],
    image_url: [],
    category_id: [],
    country_id: [],
    unit_id: [],
    currency_id: [],
    _form: [],
  },
};
