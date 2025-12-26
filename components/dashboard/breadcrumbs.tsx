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
    <nav className="flex items-center gap-2.5 text-sm text-muted-foreground leading-relaxed">
      {breadcrumbs.map((breadcrumb, index) => (
        <div key={breadcrumb.href} className="flex items-center gap-2.5">
          {index > 0 && <ChevronRight className="size-4" />}
          {breadcrumb.isLast ? (
            <span className="text-foreground font-normal">{breadcrumb.label}</span>
          ) : (
            <Link
              href={breadcrumb.href}
              className="hover:text-foreground transition-colors font-normal"
            >
              {breadcrumb.label}
            </Link>
          )}
        </div>
      ))}
    </nav>
  );
};
