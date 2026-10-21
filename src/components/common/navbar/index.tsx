import Link from "next/link";
import { Button } from "../../ui/button";
import { createClient } from "@/lib/supabase/server";
import { ActiveLink } from "./active-link";

const Navbar = async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex flex-col items-center gap-3 w-full px-4 py-3 bg-linear-to-r from-secondary to-primary md:grid md:grid-cols-3">
      {/* Kolom kiri (logo), hanya di md+ */}
      <div className="hidden md:flex justify-start">
        {/* <span className="font-bold">Logo</span> */}
      </div>

      {/* Nav links */}
      <div className="flex flex-row justify-center gap-4 md:gap-6 text-sm md:text-base whitespace-nowrap">
        <ActiveLink href="/">Home</ActiveLink>
        <ActiveLink href="/products">Products</ActiveLink>
        <ActiveLink href="/import-requests">Import Request</ActiveLink>
      </div>

      {/* Auth buttons: tengah di mobile, kanan di desktop */}
      <div className="flex flex-row gap-2 justify-center md:justify-end">
        {user ? (
          <Button size="sm" className="bg-gray-700 hover:bg-gray-500">
            Profile
          </Button>
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
    </div>
  );
};

export default Navbar;
