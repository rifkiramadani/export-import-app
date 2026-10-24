"use server";

import { createClient } from "@/lib/supabase/server";
import { currencySchema } from "@/lib/validations/currencies.schema";
import { CurrencyFormState } from "@/types/currency";
import { revalidatePath } from "next/cache";

export async function adminUpsertCurrency(
  currencyId: string | null,
  prevState: CurrencyFormState,
  formData: FormData,
): Promise<CurrencyFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      status: "error",
      errors: { ...prevState.errors, _form: ["Unauthorized Access"] },
    };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    return {
      status: "error",
      errors: { ...prevState.errors, _form: ["Access Denied: Admin only"] },
    };
  }

  const rawData = {
    name: formData.get("name") as string,
    code: formData.get("code") as string,
    symbol: formData.get("symbol") as string,
  };

  const validated = currencySchema.safeParse(rawData);
  if (!validated.success) {
    return {
      status: "error",
      errors: { ...prevState.errors, _form: [] },
    };
  }

  const payload = {
    name: validated.data.name,
    code: validated.data.code.toUpperCase(),
    symbol: validated.data.symbol,
  };

  let error = null;

  if (currencyId) {
    const { error: updateError } = await supabase
      .from("currencies")
      .update(payload)
      .eq("id", currencyId);
    error = updateError;
  } else {
    const { error: insertError } = await supabase
      .from("currencies")
      .insert(payload);
    error = insertError;
  }

  if (error) {
    return {
      status: "error",
      errors: { ...prevState.errors, _form: [error.message] },
    };
  }

  revalidatePath("/admin/dashboard/currencies", "page");
  return {
    status: "success",
    errors: {
      name: [],
      code: [],
      symbol: [],
      _form: [],
    },
  };
}

export async function adminDeleteCurrencies(
  ids: string[],
): Promise<{ success: boolean; message?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, message: "Unauthorized" };

  const { error } = await supabase
    .from("currencies")
    .delete()
    .in("id", ids);

  if (error) return { success: false, message: error.message };

  revalidatePath("/admin/dashboard/currencies", "page");
  return { success: true };
}