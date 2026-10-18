import { environment } from "@/config/environment";
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    environment.NEXT_PUBLIC_SUPABASE_URL,
    environment.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
}
