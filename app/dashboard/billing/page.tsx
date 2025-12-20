"use client";

import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { CheckoutLink, CustomerPortalLink } from "@convex-dev/polar/react";
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
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Billing</h1>
          <p className="text-muted-foreground">
            Manage your subscription and billing settings
          </p>
        </div>
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-8 w-64 mb-4" />
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
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Billing</h1>
          <p className="text-muted-foreground">
            Manage your subscription and billing settings
          </p>
        </div>
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-8 w-64 mb-4" />
            <Skeleton className="h-4 w-96" />
          </CardContent>
        </Card>
      </div>
    );
  }

  const hasActiveSubscription = subscriptionStatus.hasActiveSubscription;
  const productIds = products?.premiumMonthly
    ? [products.premiumMonthly.id]
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Billing</h1>
        <p className="text-muted-foreground">
          Manage your subscription and billing settings
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Subscription Status</CardTitle>
          <CardDescription>
            Your current subscription status and management options
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            {hasActiveSubscription ? (
              <>
                <CheckCircle2 className="w-5 h-5 text-primary" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Active Subscription</span>
                    <Badge variant="default">Active</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    You have full access to Webhook Mirror
                  </p>
                </div>
              </>
            ) : (
              <>
                <XCircle className="w-5 h-5 text-muted-foreground" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">No Active Subscription</span>
                    <Badge variant="secondary">Inactive</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Subscribe to get full access to Webhook Mirror
                  </p>
                </div>
              </>
            )}
          </div>

          <div className="pt-4 border-t">
            {hasActiveSubscription ? (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Manage your subscription, update payment methods, and view billing history.
                </p>
                <CustomerPortalLink
                  polarApi={{
                    generateCustomerPortalUrl: api.polar.generateCustomerPortalUrl,
                  }}
                >
                  <Button>Manage Subscription</Button>
                </CustomerPortalLink>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Get full access to the Nekomata Suite, including Webhook Mirror and all current and future tools.
                </p>
                {productIds.length > 0 ? (
                  <CheckoutLink
                    polarApi={api.polar}
                    productIds={productIds}
                  >
                    <Button>Get full access</Button>
                  </CheckoutLink>
                ) : (
                  <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3">
                    <p className="text-sm text-destructive">
                      No products configured. Please configure Polar products to enable subscriptions.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Nekomata Suite</CardTitle>
          <CardDescription>
            One subscription. All tools.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Your subscription includes full access to all Nekomata tools, present and future.
            Features are defined per tool, not per plan.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
