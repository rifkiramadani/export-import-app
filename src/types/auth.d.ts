export type RegisterFormState = {
  status?: string;
  errors?: {
    name?: string[];
    company_name?: string[];
    country?: string[];
    email?: string[];
    password?: string[];
    _form?: string[];
  };
};

export type LoginFormState = {
  status?: string;
  errors?: {
    email?: string[];
    password?: string[];
    _form?: string[];
  };
};
