"use client";

import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { CheckoutLink, CustomerPortalLink } from "@/components/polar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle } from "lucide-react";

export default function BillingPage() {
  const router = useRouter();
  const user = useQuery(api.users.query.getMe);
  const subscriptionStatus = useQuery(api.subscription.query.getSubscriptionStatus);
  const products = useQuery(api.polar.getConfiguredProducts);

  // Show loading while checking authentication
  if (user === undefined || subscriptionStatus === undefined || products === undefined) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-medium mb-2">Billing</h1>
          <p className="text-muted-foreground leading-relaxed">
            Manage your subscription and billing settings
          </p>
        </div>
        <Card className="border-[0.5px] border-border/60">
          <CardContent className="p-8">
            <Skeleton className="h-8 w-64 mb-5" />
            <Skeleton className="h-4 w-96" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Redirect immediately if not authenticated
  if (user === null) {
    router.replace("/signin");
    return null;
  }

  if (subscriptionStatus === undefined || products === undefined) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-medium mb-2">Billing</h1>
          <p className="text-muted-foreground leading-relaxed">
            Manage your subscription and billing settings
          </p>
        </div>
        <Card className="border-[0.5px] border-border/60">
          <CardContent className="p-8">
            <Skeleton className="h-8 w-64 mb-5" />
            <Skeleton className="h-4 w-96" />
          </CardContent>
        </Card>
      </div>
    );
  }

  const hasActiveSubscription = subscriptionStatus.hasActiveSubscription;
  const productIds = products?.premiumMonthly?.id
    ? [products.premiumMonthly.id]
    : [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-medium mb-2">Billing</h1>
        <p className="text-muted-foreground leading-relaxed">
          Manage your subscription and billing settings
        </p>
      </div>

      <Card className="border-[0.5px] border-border/60">
        <CardHeader className="pb-4">
          <CardTitle className="font-medium">Subscription Status</CardTitle>
          <CardDescription className="leading-relaxed">
            Your current subscription status and management options
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center gap-4">
            {hasActiveSubscription ? (
              <>
                <CheckCircle2 className="w-5 h-5 text-primary" />
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-normal">Active Subscription</span>
                    <Badge variant="default" className="font-normal">Active</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    You have full access to Webhook Mirror
                  </p>
                </div>
              </>
            ) : (
              <>
                <XCircle className="w-5 h-5 text-muted-foreground" />
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-normal">No Active Subscription</span>
                    <Badge variant="secondary" className="font-normal">Inactive</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Subscribe to get full access to Webhook Mirror
                  </p>
                </div>
              </>
            )}
          </div>

          <div className="pt-5 border-t border-border/60">
            {hasActiveSubscription ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Manage your subscription, update payment methods, and view billing history.
                </p>
                <CustomerPortalLink
                  polarApi={{
                    generateCustomerPortalUrl: api.polar.generateCustomerPortalUrl,
                  }}
                >
                  <Button className="font-normal">Manage Subscription</Button>
                </CustomerPortalLink>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Get full access to the Nekomata Suite, including Webhook Mirror and all current and future tools.
                </p>
                {productIds.length > 0 ? (
                  <CheckoutLink
                    polarApi={api.polar}
                    productIds={productIds}
                    embed={false}
                  >
                    <Button className="font-normal">Get full access</Button>
                  </CheckoutLink>
                ) : (
                  <div className="rounded-md border-[0.5px] border-destructive/30 bg-destructive/10 p-3.5">
                    <p className="text-sm text-destructive leading-relaxed">
                      No products configured. Please configure Polar products to enable subscriptions.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border-[0.5px] border-border/60">
        <CardHeader className="pb-4">
          <CardTitle className="font-medium">Nekomata Suite</CardTitle>
          <CardDescription className="leading-relaxed">
            One subscription. All tools.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Your subscription includes full access to all Nekomata tools, present and future.
            Features are defined per tool, not per plan.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
