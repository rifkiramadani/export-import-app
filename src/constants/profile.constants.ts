import { ProfileFormState } from "@/types/profile";

export const INITIAL_PROFILE_FORM = {
  name: "",
  company_name: "",
  bio: "",
  avatar_url: "",
  banner_url: "",
  country_id: "",
  whatsapp: "",
};

export const INITIAL_STATE_PROFILE: ProfileFormState = {
  status: "idle",
  errors: {
    name: [],
    company_name: [],
    bio: [],
    avatar_url: [],
    banner_url: [],
    country_id: [],
    whatsapp: [],
    _form: [],
  },
};
