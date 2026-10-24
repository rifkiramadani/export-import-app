import { ExportProductFormState } from "@/types/export-product";

export const INITIAL_EXPORT_PRODUCT_FORM = {
  title: "",
  description: "",
  price: "",
  min_order: "",
  whatsapp_number: "",
  image_url: "",
  category_id: "",
  country_id: "",
  unit_id: "",
  currency_id: "",
  quantity: "",
};

export const INITIAL_STATE_EXPORT_PRODUCT: ExportProductFormState = {
  status: "idle",
  errors: {
    title: [],
    description: [],
    price: [],
    min_order: [],
    whatsapp_number: [],
    image_url: [],
    category_id: [],
    country_id: [],
    unit_id: [],
    currency_id: [],
    quantity: [],
    _form: [],
  },
};
