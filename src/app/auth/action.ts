"use server";

import { createClient } from "@/lib/supabase/server";
import { loginSchema, registerSchema } from "@/lib/validations/auth.schema";
import { LoginFormState, RegisterFormState } from "@/types/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import z from "zod";

export async function login(
  prevState: LoginFormState,
  formData: FormData,
): Promise<LoginFormState> {
  const supabase = await createClient();

  const rawData = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const validated = loginSchema.safeParse(rawData);
  if (!validated.success) {
    return {
      status: "error",
      errors: z.flattenError(validated.error).fieldErrors,
    };
  }

  const { error } = await supabase.auth.signInWithPassword({
    email: validated.data.email,
    password: validated.data.password,
  });

  if (error) {
    return {
      status: "error",
      errors: {
        ...prevState.errors,
        _form: [error.message],
      },
    };
  }

  revalidatePath("/", "layout");
  redirect("/");
}

export async function signUp(
  prevState: RegisterFormState,
  formData: FormData,
): Promise<RegisterFormState> {
  const supabase = await createClient();

  const rawData = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
    name: formData.get("name") as string,
    company_name: formData.get("company_name") as string,
    country: formData.get("country") as string,
  };

  const validated = registerSchema.safeParse(rawData);
  if (!validated.success) {
    return {
      status: "error",
      errors: z.flattenError(validated.error).fieldErrors,
    };
  }

  const { error } = await supabase.auth.signUp({
    email: validated.data.email,
    password: validated.data.password,
    options: {
      data: {
        name: validated.data.name, //ditangkap oleh Trigger SQL handle_new_user()
        company_name: validated.data.company_name,
        country_id: validated.data.country,
      },
    },
  });

  if (error) {
    return {
      status: "error",
      errors: {
        ...prevState.errors,
        _form: [error.message],
      },
    };
  }

  revalidatePath("/", "layout");
  redirect("/auth/login?message=Check Your Email For Account Verification");
}

export async function logOut() {
  const supabase = await createClient();

  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Supabase sign out error: ", error);
      return;
    }
  } catch (error) {
    console.error("Error Signing Out: ", error);
    return;
  }
  revalidatePath("/", "layout");
  redirect("/auth/login");
}