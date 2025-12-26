"use client";

import { Breadcrumbs } from "./breadcrumbs";

export const Header = () => {
  return (
    <header className="border-b border-border/60 bg-background px-8 py-5">
      <Breadcrumbs />
    </header>
  );
};
