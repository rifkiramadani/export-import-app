"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeftRight, Globe, Home, LogOut } from "lucide-react";
import { logOut } from "@/app/auth/action";
import { USER_SIDEBAR_MENU_ITEM } from "@/constants/sidebar-menu.constants";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";

const QUICK_LINKS = [
  { title: "Back to Home", href: "/", icon: Home },
  { title: "Back to Products", href: "/products", icon: Globe },
  {
    title: "Back to Import Requests",
    href: "/import-requests",
    icon: ArrowLeftRight,
  },
];

export function AppSidebar({ role }: { role: "admin" | "user" }) {
  const pathname = usePathname();
  const menuItems = USER_SIDEBAR_MENU_ITEM[role];

  return (
    <Sidebar
      collapsible="offcanvas"
      // gradient dipasang ke panel dalam sidebar
    >
      <SidebarHeader className="h-16 justify-center border-b border-white/10 px-6">
        <span className="text-lg font-semibold">Dashboard Panel</span>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup className="p-4">
          <SidebarGroupLabel className="text-white/50 uppercase tracking-wider">
            Management
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {menuItems.map((item) => {
                const Icon = item.icons;
                const isActive =
                  pathname === item.href ||
                  pathname.startsWith(`${item.href}/`);

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      isActive={isActive}
                      tooltip={item.title}
                      render={<Link href={item.href} />}
                    >
                      <Icon />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-white/10 p-4">
        <SidebarGroup className="p-0">
          <SidebarGroupLabel className="text-white/50 uppercase tracking-wider">
            Quick Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {QUICK_LINKS.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    tooltip={item.title}
                    render={<Link href={item.href} />}
                  >
                    <item.icon />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}

              <SidebarMenuItem>
                <form action={logOut}>
                  <SidebarMenuButton
                    type="submit"
                    tooltip="Logout"
                    className="text-red-300 hover:bg-red-500/20 hover:text-red-200 cursor-pointer"
                  >
                    <LogOut />
                    <span>Logout</span>
                  </SidebarMenuButton>
                </form>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
