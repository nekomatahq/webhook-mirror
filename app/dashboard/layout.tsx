"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Header } from "@/components/dashboard/header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const user = useQuery(api.users.query.getMe);
  const subscriptionStatus = useQuery(api.subscription.query.getSubscriptionStatus);

  // Allow access to billing page without subscription
  const isBillingPage = pathname === "/dashboard/billing";

  // Redirect if not authenticated
  useEffect(() => {
    if (user === null) {
      router.replace("/signin");
    }
  }, [user, router]);

  // Show loading while checking authentication
  if (user === undefined || subscriptionStatus === undefined) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // Return null while redirecting
  if (user === null) {
    return null;
  }

  // Allow access to billing page even without subscription
  if (!subscriptionStatus?.hasActiveSubscription && !isBillingPage) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="max-w-md space-y-4 text-center">
          <h1 className="text-2xl font-semibold">Subscription Required</h1>
          <p className="text-muted-foreground">
            You need an active subscription to access Webhook Mirror.
          </p>
          <a
            href="/dashboard/billing"
            className="inline-block rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Manage Subscription
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
