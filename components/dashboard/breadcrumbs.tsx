"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";

export const Breadcrumbs = () => {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  const breadcrumbMap: Record<string, string> = {
    dashboard: "Dashboard",
    endpoints: "Endpoints",
    billing: "Billing",
  };

  const breadcrumbs = segments.map((segment, index) => {
    const href = "/" + segments.slice(0, index + 1).join("/");
    const label =
      breadcrumbMap[segment] ||
      segment.charAt(0).toUpperCase() + segment.slice(1);

    return {
      href,
      label,
      isLast: index === segments.length - 1,
    };
  });

  if (breadcrumbs.length === 0) {
    return null;
  }

  return (
    <nav className="flex items-center gap-3 text-sm text-muted-foreground/60 leading-relaxed font-light tracking-wide">
      {breadcrumbs.map((breadcrumb, index) => (
        <div key={breadcrumb.href} className="flex items-center gap-3">
          {index > 0 && <ChevronRight className="w-3.5 h-3.5 opacity-40" strokeWidth={1.5} />}
          {breadcrumb.isLast ? (
            <span className="text-foreground/90 font-normal">{breadcrumb.label}</span>
          ) : (
            <Link
              href={breadcrumb.href}
              className="hover:text-foreground/80 transition-colors duration-300"
            >
              {breadcrumb.label}
            </Link>
          )}
        </div>
      ))}
    </nav>
  );
};
