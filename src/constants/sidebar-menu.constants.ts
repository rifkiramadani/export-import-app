import {
  BadgeDollarSign,
  Flag,
  Package,
  ShoppingCart,
  Tag,
  User,
  UserGroup,
  Weight,
} from "lucide-react";

export const USER_SIDEBAR_MENU_ITEM = {
  admin: [
    {
      title: "Admin Profile",
      href: "/admin/dashboard/profile",
      icons: User,
    },
    {
      title: "All Products",
      href: "/admin/dashboard/export-products",
      icons: Package,
    },
    {
      title: "All Import Requests",
      href: "/admin/dashboard/import-requests",
      icons: ShoppingCart,
    },
    {
      title: "User Management",
      href: "/admin/dashboard/users",
      icons: UserGroup,
    },
    {
      title: "Categories",
      href: "/admin/dashboard/categories",
      icons: Tag,
    },
    {
      title: "Countries",
      href: "/admin/dashboard/countries",
      icons: Flag,
    },
    {
      title: "Units",
      href: "/admin/dashboard/units",
      icons: Weight,
    },
    {
      title: "Currencies",
      href: "/admin/dashboard/Currencies",
      icons: BadgeDollarSign,
    },
  ],
  user: [
    {
      title: "Your Profile",
      href: "/user/dashboard/profile",
      icons: User,
    },
    {
      title: "Your Products",
      href: "/user/dashboard/export-products",
      icons: Package,
    },
    {
      title: "Your Import Requests",
      href: "/user/dashboard/import-requests",
      icons: ShoppingCart,
    },
  ],
};
