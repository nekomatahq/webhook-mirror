"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Header } from "@/components/dashboard/header";
import { Loader2 } from "lucide-react";

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
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground/50" />
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
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        {isFreeTier && (
          <div className="border-b border-yellow-200/30 bg-yellow-50/50 dark:bg-yellow-950/10 dark:border-yellow-900/30 backdrop-blur-sm">
            <div className="px-10 py-4">
              <p className="text-sm text-yellow-800/80 dark:text-yellow-200/80 leading-relaxed font-light tracking-wide">
                <span className="font-normal">Free tier:</span> You are on the free tier. Hard limits apply: 1 endpoint max, 5 stored requests per endpoint.{" "}
                <a
                  href="/dashboard/billing"
                  className="underline decoration-yellow-800/30 hover:decoration-yellow-800/80 underline-offset-4 hover:text-yellow-900 dark:hover:text-yellow-100 transition-all font-normal"
                >
                  Upgrade to unlock unlimited access
                </a>
              </p>
            </div>
          </div>
        )}
        <main className="flex-1 overflow-y-auto p-10 pl-12">{children}</main>
      </div>
    </div>
  );
}
