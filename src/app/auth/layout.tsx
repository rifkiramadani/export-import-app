import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import React from "react";

interface IAuthLayout {
  children: React.ReactNode;
}

const AuthLayout = async ({ children }: IAuthLayout) => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/");
  }

  return (
    <div className="flex min-h-screen justify-center items-center px-3">
      <div className="w-full max-w-md rounded-xl">{children}</div>
    </div>
  );
};

export default AuthLayout;
