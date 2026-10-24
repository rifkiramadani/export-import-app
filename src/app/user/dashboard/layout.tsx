import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/common/sidebar";

export default async function UserDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  // Opsi: Jika admin masuk ke rute user, arahkan otomatis ke dashboard admin
  if (profile?.role === "admin") {
    redirect("/admin/dashboard/profile");
  }

  const role = "user"; // Karena sudah diproteksi, di sini pasti user

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-foreground": "oklch(1 0 0)",
          "--sidebar-accent": "oklch(1 0 0 / 0.2)",
          "--sidebar-accent-foreground": "oklch(1 0 0)",
          "--sidebar-border": "oklch(1 0 0 / 0.1)",
        } as React.CSSProperties
      }
    >
      <AppSidebar role={role} />
      <SidebarInset className="bg-slate-50">
        <header className="sticky top-0 z-10 flex h-14 items-center gap-2 border-b bg-slate-50/80 px-4 backdrop-blur">
          <SidebarTrigger />
        </header>
        <div className="p-8">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}