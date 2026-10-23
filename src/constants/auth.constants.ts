export const INITIAL_REGISTER_FORM = {
  name: "",
  company_name: "",
  country: "",
  email: "",
  password: "",
};

export const INITIAL_STATE_REGISTER = {
  status: "idle",
  errors: {
    name: [],
    company_name: [],
    country: [],
    email: [],
    password: [],
    _form: [],
  },
};

export const INITIAL_LOGIN_FORM = {
  email: "",
  password: "",
};

export const INTIAL_STATE_LOGIN = {
  status: "idle",
  errors: {
    email: [],
    password: [],
    _form: [],
  },
};
