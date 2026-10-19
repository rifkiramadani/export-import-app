import z from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email Is Required")
    .pipe(z.email({ message: "Email Format Is Not Valid" })),
  password: z.string().min(1, "Password Is Required"),
});

export const registerSchema = z.object({
  name: z.string().min(3, "Name Must Within 3 Character"),
  company_name: z.string().min(1, "Company Name Is Required"),
  country: z.string().min(1, "Country Is Required"),
  email: z.string().pipe(z.email({ message: "Email Format Is Not Valid" })),
  password: z.string().min(1, "Password Is Required"),
});

export type LoginForm = z.infer<typeof loginSchema>;
export type RegisterForm = z.infer<typeof registerSchema>;
