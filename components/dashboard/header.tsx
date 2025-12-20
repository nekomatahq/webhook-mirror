"use client";

import { Breadcrumbs } from "./breadcrumbs";

export const Header = () => {
  return (
    <header className="border-b border-border bg-background px-6 py-4">
      <Breadcrumbs />
    </header>
  );
};
