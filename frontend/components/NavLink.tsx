"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { forwardRef, type ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/utils";

type NavLinkProps = Omit<ComponentPropsWithoutRef<typeof Link>, "className"> & {
  className?: string | ((state: { isActive: boolean }) => string);
  activeClassName?: string;
  end?: boolean;
};

const NavLink = forwardRef<HTMLAnchorElement, NavLinkProps>(
  ({ className, activeClassName, href, end, ...props }, ref) => {
    const pathname = usePathname();
    const hrefString = typeof href === "string" ? href : href.pathname ?? "";
    const isActive = end
      ? pathname === hrefString
      : pathname === hrefString || pathname.startsWith(`${hrefString}/`);

    const resolvedClassName =
      typeof className === "function" ? className({ isActive }) : cn(className, isActive && activeClassName);

    return <Link ref={ref} href={href} className={resolvedClassName} {...props} />;
  },
);

NavLink.displayName = "NavLink";

export { NavLink };
