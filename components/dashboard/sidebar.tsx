"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Webhook Mirror", href: "/dashboard" },
  { name: "Endpoints", href: "/dashboard/endpoints" },
  { name: "Billing", href: "/dashboard/billing" },
];

export const Sidebar = () => {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r border-border/60 bg-sidebar p-8 pr-10">
      <nav className="space-y-2">
        {navigation.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "block rounded-md px-4 py-2.5 text-sm transition-colors leading-relaxed",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-normal"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground font-normal"
              )}
            >
              {item.name}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};
