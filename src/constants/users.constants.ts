import { UserFormState } from "@/types/user";

export const INITIAL_USER_FORM = {
  name: "",
  company_name: "",
  role: "user" as const,
  avatar_url: "",
  banner_url: "",
};

export const INITIAL_STATE_USER: UserFormState = {
  status: "idle",
  errors: {
    name: [],
    company_name: [],
    role: [],
    avatar_url: [],
    banner_url: [],
    _form: [],
  },
};