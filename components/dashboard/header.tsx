"use client";

import { Breadcrumbs } from "./breadcrumbs";

export const Header = () => {
  return (
    <header className="border-b-[0.5px] border-border/40 bg-background/80 backdrop-blur-md px-10 py-6">
      <Breadcrumbs />
    </header>
  );
};
