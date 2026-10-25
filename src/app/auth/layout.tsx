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
    /* Elemen Utama (Memiliki sifat Flexbox untuk menengahkan konten di dalamnya) */
    <div className="flex min-h-screen justify-center items-center px-3 bg-[url('/landing-page-background.jpeg')] bg-cover bg-center bg-no-repeat">
      {/* 
        1. OVERLAY dipisah dan dibuat berdiri sendiri. 
        2. Ditambahkan pointer-events-none agar lapisan transparan ini tidak menghalangi klik mouse pada form.
      */}
      <div className="inset-0 absolute bg-black/40 backdrop-blur-sm pointer-events-none" />

      {/* 
        3. FORM {children} dikeluarkan dari overlay.
        4. Ditambahkan bg-white (atau warna lain) opsional agar form memiliki latar belakang kontras dari gambar pasar yang ramai.
      */}
      <div className="w-full max-w-md rounded-xl relative">{children}</div>
    </div>
  );
};

export default AuthLayout;
