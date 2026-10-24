import { CategoryFormState } from "@/types/category";

export const INITIAL_CATEGORY_FORM = {
  name: "",
};

export const INITIAL_STATE_CATEGORY: CategoryFormState = {
  status: "idle",
  errors: {
    name: [],
    _form: [],
  },
};