"use client";

import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";

export default function EndpointsPage() {
  const router = useRouter();
  const endpoints = useQuery(api.endpoints.query.listEndpoints);

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
          <h1 className="text-2xl font-semibold">Endpoints</h1>
          <p className="text-muted-foreground">
            Manage your webhook endpoints
          </p>
        </div>
        <Button onClick={() => router.push("/dashboard")}>
          Create endpoint
        </Button>
      </div>

      {endpoints.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">
              No endpoints yet. Create your first endpoint to get started.
            </p>
            <Button onClick={() => router.push("/dashboard")}>
              Create your first endpoint
            </Button>
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
