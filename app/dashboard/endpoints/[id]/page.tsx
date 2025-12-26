"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { EndpointUrl } from "@/components/dashboard/endpoint-url";
import { RequestListItem } from "@/components/dashboard/request-list";
import { ReplayForm } from "@/components/dashboard/replay-form";

export default function EndpointDetailPage() {
  const params = useParams();
  const router = useRouter();
  const endpointId = params.id as Id<"endpoints">;
  const endpoint = useQuery(api.endpoints.query.getEndpoint, { id: endpointId });
  const requests = useQuery(api.requests.query.listRequests, { endpointId });
  const subscriptionStatus = useQuery(api.subscription.query.getSubscriptionStatus);
  const updateEndpoint = useMutation(api.endpoints.mutation.updateEndpoint);
  const [editingName, setEditingName] = useState(false);
  const [endpointName, setEndpointName] = useState("");
  const [selectedRequestId, setSelectedRequestId] = useState<Id<"requests"> | null>(null);
  const [bodyView, setBodyView] = useState<"raw" | "json" | "hex">("raw");
  const [toggleError, setToggleError] = useState<string | null>(null);
  const selectedRequest = useQuery(
    api.requests.query.getRequest,
    selectedRequestId ? { id: selectedRequestId } : "skip"
  );

  const hasActiveSubscription = subscriptionStatus?.hasActiveSubscription ?? false;

  if (endpoint === undefined || requests === undefined || subscriptionStatus === undefined) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (endpoint === null) {
    return (
      <div className="space-y-5">
        <h1 className="text-2xl font-medium mb-2">Endpoint not found</h1>
        <Button onClick={() => router.push("/dashboard")} className="font-normal">Back to Dashboard</Button>
      </div>
    );
  }

  const handleNameEdit = () => {
    setEndpointName(endpoint.name);
    setEditingName(true);
  };

  const handleNameSave = async () => {
    if (endpointName.trim() && endpointName !== endpoint.name) {
      await updateEndpoint({ id: endpointId, name: endpointName.trim() });
    }
    setEditingName(false);
  };

  const handleNameCancel = () => {
    setEndpointName("");
    setEditingName(false);
  };

  const handleToggleActive = async () => {
    if (!hasActiveSubscription) {
      setToggleError("Endpoint activation is available with Nekomata Suite");
      return;
    }
    setToggleError(null);
    try {
      await updateEndpoint({ id: endpointId, active: !endpoint.active });
    } catch (error: any) {
      const errorMsg = error?.message || "Failed to update endpoint";
      setToggleError(errorMsg);
    }
  };

  const formatJson = (body: string | null): string => {
    if (body === null) return "No body";
    try {
      const parsed = JSON.parse(body);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return "Invalid JSON";
    }
  };

  const formatHex = (body: string | null): string => {
    if (body === null) return "No body";
    const encoder = new TextEncoder();
    const bytes = encoder.encode(body);
    const bytesPerLine = 10;
    const lines: string[] = [];
    
    for (let i = 0; i < bytes.length; i += bytesPerLine) {
      const offset = i.toString(16).padStart(8, "0").toUpperCase();
      const chunk = Array.from(bytes.slice(i, i + bytesPerLine));
      
      // Format hex: always 4 bytes per line
      const hex = Array.from({ length: bytesPerLine }, (_, idx) => {
        if (idx < chunk.length) {
          return chunk[idx].toString(16).padStart(2, "0").toUpperCase();
        }
        return "  "; // Two spaces for missing bytes
      }).join(" ");
      
      // Format ASCII: 4 characters per line
      const ascii = Array.from({ length: bytesPerLine }, (_, idx) => {
        if (idx < chunk.length) {
          const byte = chunk[idx];
          return (byte >= 32 && byte <= 126) ? String.fromCharCode(byte) : ".";
        }
        return " "; // Space for missing bytes
      }).join("");
      
      lines.push(`${offset}: ${hex}  ${ascii}`);
    }
    
    return lines.join("\n");
  };

  const getBodyContent = (body: string | null): string => {
    if (body === null) return "No body";
    switch (bodyView) {
      case "json":
        return formatJson(body);
      case "hex":
        return formatHex(body);
      default:
        return body;
    }
  };

  return (
    <div className="space-y-8">
      <Card className="border-[0.5px] border-border/60">
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {editingName ? (
                <div className="flex items-center gap-3">
                  <Input
                    value={endpointName}
                    onChange={(e) => setEndpointName(e.target.value)}
                    className="max-w-md"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleNameSave();
                      if (e.key === "Escape") handleNameCancel();
                    }}
                  />
                  <Button size="sm" onClick={handleNameSave} className="font-normal">
                    Save
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleNameCancel} className="font-normal">
                    Cancel
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <CardTitle className="font-medium">{endpoint.name}</CardTitle>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleNameEdit}
                    className="font-normal"
                  >
                    Edit
                  </Button>
                </div>
              )}
            </div>
            <div className="flex flex-col items-end gap-3">
              <div className="flex items-center gap-3">
                {endpoint.active ? (
                  <Badge variant="default" className="font-normal">Active</Badge>
                ) : (
                  <Badge variant="secondary" className="font-normal">Inactive</Badge>
                )}
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={handleToggleActive}
                  disabled={!hasActiveSubscription}
                  title={!hasActiveSubscription ? "Endpoint activation is available with Nekomata Suite" : undefined}
                  className="font-normal"
                >
                  {endpoint.active ? "Deactivate" : "Activate"}
                </Button>
              </div>
              {!hasActiveSubscription && (
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Endpoint activation is available with Nekomata Suite
                </p>
              )}
              {toggleError && (
                <p className="text-xs text-destructive leading-relaxed">{toggleError}</p>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div>
            <label className="text-sm font-normal mb-3 block leading-relaxed">Webhook URL</label>
            <EndpointUrl slug={endpoint.slug} />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="border-[0.5px] border-border/60">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="font-medium">Requests</CardTitle>
              {!hasActiveSubscription && requests.length > 0 && (
                <span className="text-sm text-muted-foreground leading-relaxed">
                  {requests.length}/5 requests
                </span>
              )}
            </div>
            {!hasActiveSubscription && (
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                Free tier includes 5 captured requests
              </p>
            )}
          </CardHeader>
          <CardContent>
            {requests.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground leading-relaxed">
                <p>No requests yet. Send a webhook to this endpoint to see it here.</p>
              </div>
            ) : (
              <ScrollArea className="h-[600px]">
                <div className="space-y-3">
                  {requests.map((request) => (
                    <RequestListItem
                      key={request._id}
                      id={request._id}
                      method={request.method}
                      timestamp={request.timestamp}
                      bodySize={request.bodySize}
                      onClick={() => setSelectedRequestId(request._id)}
                    />
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        <Card className="border-[0.5px] border-border/60">
          <CardHeader className="pb-4">
            <CardTitle className="font-medium">Request Details</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedRequestId === null ? (
              <div className="text-center py-10 text-muted-foreground leading-relaxed">
                <p>Select a request to view details</p>
              </div>
            ) : selectedRequest === undefined ? (
              <div className="space-y-3">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-64 w-full" />
              </div>
            ) : selectedRequest === null ? (
              <div className="text-center py-10 text-muted-foreground leading-relaxed">
                <p>Request not found</p>
              </div>
            ) : (
              <div className="space-y-5">
                <Tabs defaultValue="headers">
                  <TabsList>
                    <TabsTrigger value="headers">Headers</TabsTrigger>
                    <TabsTrigger value="body">Body</TabsTrigger>
                  </TabsList>
                  <TabsContent value="headers" className="mt-5">
                    <ScrollArea className="h-[400px]">
                      <div className="space-y-3">
                        {Object.entries(selectedRequest.headers).map(([key, value]) => (
                          <div key={key} className="rounded-md border-[0.5px] border-border/60 p-3">
                            <div className="font-mono text-sm leading-relaxed">
                              <span className="font-normal">{key}:</span>{" "}
                              <span className="text-muted-foreground">{value}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </TabsContent>
                  <TabsContent value="body" className="mt-5">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <Button
                          size="sm"
                          variant={bodyView === "raw" ? "default" : "outline"}
                          onClick={() => setBodyView("raw")}
                          className="font-normal"
                        >
                          RAW
                        </Button>
                        <Button
                          size="sm"
                          variant={bodyView === "json" ? "default" : "outline"}
                          onClick={() => setBodyView("json")}
                          className="font-normal"
                        >
                          JSON Pretty
                        </Button>
                        <Button
                          size="sm"
                          variant={bodyView === "hex" ? "default" : "outline"}
                          onClick={() => setBodyView("hex")}
                          className="font-normal"
                        >
                          Hex
                        </Button>
                      </div>
                      <ScrollArea className="h-[400px]">
                        {selectedRequest.body === null ? (
                          <div className="text-muted-foreground leading-relaxed">No body</div>
                        ) : (
                          <pre className="rounded-md border-[0.5px] border-border/60 bg-muted p-4 font-mono text-sm whitespace-pre-wrap overflow-wrap-anywhere leading-relaxed">
                            {getBodyContent(selectedRequest.body)}
                          </pre>
                        )}
                      </ScrollArea>
                    </div>
                  </TabsContent>
                </Tabs>

                <Separator />

                <div>
                  <h3 className="text-sm font-normal mb-3 leading-relaxed">Replay Request</h3>
                  <ReplayForm requestId={selectedRequestId} hasActiveSubscription={hasActiveSubscription} />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
