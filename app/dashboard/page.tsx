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

export default function DashboardPage() {
  const router = useRouter();
  const endpoints = useQuery(api.endpoints.query.listEndpoints);
  const createEndpoint = useMutation(api.endpoints.mutation.createEndpoint);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [endpointName, setEndpointName] = useState("");
  const [creating, setCreating] = useState(false);

  const handleCreateEndpoint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!endpointName.trim()) return;

    setCreating(true);
    try {
      const result = await createEndpoint({ name: endpointName.trim() });
      setEndpointName("");
      setShowCreateForm(false);
      router.push(`/dashboard/endpoints/${result._id}`);
    } catch (error) {
      console.error("Failed to create endpoint:", error);
    } finally {
      setCreating(false);
    }
  };

  if (endpoints === undefined) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Webhook Mirror</h1>
          <p className="text-muted-foreground">
            Create endpoints to capture and inspect webhook requests
          </p>
        </div>
        {!showCreateForm && (
          <Button onClick={() => setShowCreateForm(true)}>Create endpoint</Button>
        )}
      </div>

      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create Endpoint</CardTitle>
            <CardDescription>
              Enter a name for your webhook endpoint
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateEndpoint} className="flex gap-2">
              <Input
                type="text"
                placeholder="My Webhook Endpoint"
                value={endpointName}
                onChange={(e) => setEndpointName(e.target.value)}
                className="flex-1"
                disabled={creating}
                autoFocus
              />
              <Button type="submit" disabled={creating || !endpointName.trim()}>
                {creating ? "Creating..." : "Create"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowCreateForm(false);
                  setEndpointName("");
                }}
                disabled={creating}
              >
                Cancel
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {endpoints.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">
              No endpoints yet. Create your first endpoint to get started.
            </p>
            {!showCreateForm && (
              <Button onClick={() => setShowCreateForm(true)}>
                Create your first endpoint
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {endpoints.map((endpoint) => (
            <Card
              key={endpoint._id}
              className="cursor-pointer transition-colors hover:bg-accent"
              onClick={() => router.push(`/dashboard/endpoints/${endpoint._id}`)}
            >
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{endpoint.name}</h3>
                      {endpoint.active ? (
                        <Badge variant="default">Active</Badge>
                      ) : (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground font-mono">
                      {endpoint.slug}
                    </p>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
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
