import { UnitFormState } from "@/types/unit";

export const INITIAL_UNIT_FORM = {
  name: "",
};

export const INITIAL_STATE_UNIT: UnitFormState = {
  status: "idle",
  errors: {
    name: [],
    _form: [],
  },
};
