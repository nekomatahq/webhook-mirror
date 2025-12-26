"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";

export default function EndpointsPage() {
  const router = useRouter();
  const endpoints = useQuery(api.endpoints.query.listEndpoints);
  const subscriptionStatus = useQuery(api.subscription.query.getSubscriptionStatus);
  const createEndpoint = useMutation(api.endpoints.mutation.createEndpoint);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [endpointName, setEndpointName] = useState("");
  const [creating, setCreating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleCreateEndpoint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!endpointName.trim()) return;

    setCreating(true);
    setErrorMessage(null);
    try {
      const result = await createEndpoint({ name: endpointName.trim() });
      setEndpointName("");
      setShowCreateForm(false);
      router.push(`/dashboard/endpoints/${result._id}`);
    } catch (error: any) {
      console.error("Failed to create endpoint:", error);
      // Extract user-friendly error message
      const errorMsg = error?.message || "Failed to create endpoint";
      setErrorMessage(errorMsg);
    } finally {
      setCreating(false);
    }
  };

  const hasActiveSubscription = subscriptionStatus?.hasActiveSubscription ?? false;
  const canCreateEndpoint = hasActiveSubscription || (endpoints?.length ?? 0) < 1;

  if (endpoints === undefined || subscriptionStatus === undefined) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-medium mb-2">Endpoints</h1>
          <p className="text-muted-foreground leading-relaxed">
            Manage your webhook endpoints
            {!hasActiveSubscription && endpoints.length > 0 && (
              <span className="ml-2 text-sm">
                ({endpoints.length}/1 endpoint)
              </span>
            )}
          </p>
        </div>
        {!showCreateForm && (
          <Button 
            onClick={() => setShowCreateForm(true)}
            disabled={!canCreateEndpoint}
            title={!canCreateEndpoint ? "Free tier includes 1 endpoint. Upgrade to unlock unlimited endpoints" : undefined}
          >
            Create endpoint
          </Button>
        )}
      </div>

      {showCreateForm && (
        <Card className="border-[0.5px] border-border/60">
          <CardHeader className="pb-4">
            <CardTitle className="font-medium">Create Endpoint</CardTitle>
            <CardDescription className="leading-relaxed">
              Enter a name for your webhook endpoint
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateEndpoint} className="space-y-4">
              {errorMessage && (
                <div className="rounded-md border-[0.5px] border-destructive/50 bg-destructive/10 p-3.5">
                  <p className="text-sm text-destructive leading-relaxed">{errorMessage}</p>
                </div>
              )}
              {!canCreateEndpoint && (
                <div className="rounded-md border-[0.5px] border-muted/60 bg-muted/50 p-3.5">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Free tier includes 1 endpoint. Upgrade to unlock unlimited endpoints.
                  </p>
                </div>
              )}
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="My Webhook Endpoint"
                  value={endpointName}
                  onChange={(e) => setEndpointName(e.target.value)}
                  className="flex-1"
                  disabled={creating || !canCreateEndpoint}
                  autoFocus
                />
                <Button type="submit" disabled={creating || !endpointName.trim() || !canCreateEndpoint}>
                  {creating ? "Creating..." : "Create"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowCreateForm(false);
                    setEndpointName("");
                    setErrorMessage(null);
                  }}
                  disabled={creating}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {endpoints.length === 0 ? (
        <Card className="border-[0.5px] border-border/60">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <p className="text-muted-foreground mb-6 leading-relaxed">
              No endpoints yet. Create your first endpoint to get started.
            </p>
            {!showCreateForm && (
              <Button onClick={() => setShowCreateForm(true)} className="border-[0.5px] font-normal">
                Create your first endpoint
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {endpoints.map((endpoint) => (
            <Card
              key={endpoint._id}
              className="cursor-pointer transition-colors hover:bg-accent/50 border-[0.5px] border-border/60"
              onClick={() => router.push(`/dashboard/endpoints/${endpoint._id}`)}
            >
              <CardContent className="flex items-center justify-between p-5">
                <div className="flex items-center gap-5">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-normal">{endpoint.name}</h3>
                      {endpoint.active ? (
                        <Badge variant="default" className="font-normal">Active</Badge>
                      ) : (
                        <Badge variant="secondary" className="font-normal">Inactive</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground font-mono leading-relaxed">
                      {endpoint.slug}
                    </p>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground leading-relaxed">
                  Created {formatDistanceToNow(new Date(endpoint._creationTime), { addSuffix: true })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
