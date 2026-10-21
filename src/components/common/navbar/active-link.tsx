"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface ActiveLinkProps {
  href: string;
  children: React.ReactNode;
}

export const ActiveLink = ({ href, children }: ActiveLinkProps) => {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link href={href}>
      <span
        className={`cursor-pointer transition ${
          isActive ? "cursor-pointer text-gray-400" : "text-white"
        }`}
      >
        {children}
      </span>
    </Link>
  );
};
