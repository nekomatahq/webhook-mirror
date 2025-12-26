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
    <aside className="w-72 border-r-[0.5px] border-border/40 bg-background/50 backdrop-blur-sm p-8 pr-10 pt-10">
      <nav className="space-y-3">
        {navigation.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "block rounded-md px-5 py-3 text-sm transition-all duration-300 leading-relaxed tracking-wide",
                isActive
                  ? "bg-foreground/5 text-foreground font-normal"
                  : "text-muted-foreground/70 hover:bg-foreground/5 hover:text-foreground font-light"
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
