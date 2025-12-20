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

  // Free users can access the dashboard with limits - no blocking paywall

  const isFreeTier = !subscriptionStatus?.hasActiveSubscription;

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        {isFreeTier && (
          <div className="border-b border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20 dark:border-yellow-900/50">
            <div className="px-6 py-3">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                <span className="font-medium">Free tier:</span> You are on the free tier. Hard limits apply: 1 endpoint max, 5 stored requests per endpoint.{" "}
                <a
                  href="/dashboard/billing"
                  className="underline hover:no-underline font-medium"
                >
                  Upgrade to unlock unlimited access
                </a>
              </p>
            </div>
          </div>
        )}
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
