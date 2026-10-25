import { NextRequest } from "next/server";
import { updateSession } from "./lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - profile (public profile pages)
     */
    "/((?!_next/static|_next/image|favicon.ico|profile|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};