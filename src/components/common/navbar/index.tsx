import Link from "next/link";
import { Button } from "../../ui/button";
import { createClient } from "@/lib/supabase/server";
import { ActiveLink } from "./active-link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LayoutDashboard, LogOut } from "lucide-react";
import { logOut } from "@/app/auth/action";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const Navbar = async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile = null;
  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("name, avatar_url, company_name, role")
      .eq("id", user.id)
      .single();

    profile = data;
  }

  const dashboardHref = `/${profile?.role ?? "user"}/dashboard/profile`;

  return (
    <header className="flex flex-col items-center gap-3 w-full px-4 py-3 bg-linear-to-r from-secondary to-primary md:grid md:grid-cols-3">
      {/* Kolom kiri (logo), hanya di md+ */}
      <div className="hidden md:flex justify-start">
        {/* <span className="font-bold">Logo</span> */}
      </div>

      {/* Nav links */}
      <nav className="flex flex-row justify-center gap-4 md:gap-6 text-sm md:text-base whitespace-nowrap">
        <ActiveLink href="/">Home</ActiveLink>
        <ActiveLink href="/products">Products</ActiveLink>
        <ActiveLink href="/import-requests">Import Request</ActiveLink>
      </nav>

      {/* Auth buttons: tengah di mobile, kanan di desktop */}
      <div className="flex flex-row gap-2 justify-center md:justify-end">
        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button className="flex items-center gap-2 focus:outline-none rounded-full ring-offset-background transition-all hover:opacity-80 p-0 h-10 w-10">
                  <Avatar size="lg">
                    {profile?.avatar_url ? (
                      <AvatarImage
                        src={profile?.avatar_url}
                        alt={profile?.name || "Avatar"}
                        className="w-10 h-10 rounded-full object-cover border border-slate-200"
                      />
                    ) : (
                      <AvatarFallback className="flex  rounded-full bg-gray-500 text-white items-center justify-center font-light text-sm">
                        {profile?.name?.[0]?.toUpperCase() ||
                          user.email?.[0]?.toUpperCase() ||
                          "U"}
                      </AvatarFallback>
                    )}
                  </Avatar>
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="w-56 p-2">
              <div className="px-2 py-1.5 text-center text-xs text-slate-500 font-medium truncate">
                {profile?.name}
              </div>
              <DropdownMenuSeparator />

              <DropdownMenuItem>
                <Link
                  href={dashboardHref}
                  className="flex items-center gap-2 cursor-pointer w-full py-2"
                >
                  <LayoutDashboard size={16} />
                  <span>Your Dashboard</span>
                </Link>
              </DropdownMenuItem>

              <form action={logOut}>
                <DropdownMenuItem className="hover:bg-red-50 hover:text-red-600">
                  <button
                    type="submit"
                    className="flex items-center gap-2 w-full text-red-600 py-2 text-sm rounded-md transition-all cursor-pointer"
                  >
                    <LogOut size={16} />
                    <span>Logout</span>
                  </button>
                </DropdownMenuItem>
              </form>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <>
            <Link href="/auth/login">
              <Button size="sm" className="bg-gray-700 hover:bg-gray-500">
                Log In
              </Button>
            </Link>
            <Link href="/auth/register">
              <Button size="sm" className="bg-gray-700 hover:bg-gray-500">
                Sign Up
              </Button>
            </Link>
          </>
        )}
      </div>
    </header>
  );
};

export default Navbar;
