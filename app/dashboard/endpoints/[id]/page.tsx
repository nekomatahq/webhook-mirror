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
  const updateEndpoint = useMutation(api.endpoints.mutation.updateEndpoint);
  const [editingName, setEditingName] = useState(false);
  const [endpointName, setEndpointName] = useState("");
  const [selectedRequestId, setSelectedRequestId] = useState<Id<"requests"> | null>(null);
  const [bodyView, setBodyView] = useState<"raw" | "json" | "hex">("raw");
  const selectedRequest = useQuery(
    api.requests.query.getRequest,
    selectedRequestId ? { id: selectedRequestId } : "skip"
  );

  if (endpoint === undefined || requests === undefined) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (endpoint === null) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Endpoint not found</h1>
        <Button onClick={() => router.push("/dashboard")}>Back to Dashboard</Button>
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
    await updateEndpoint({ id: endpointId, active: !endpoint.active });
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
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {editingName ? (
                <div className="flex items-center gap-2">
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
                  <Button size="sm" onClick={handleNameSave}>
                    Save
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleNameCancel}>
                    Cancel
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <CardTitle>{endpoint.name}</CardTitle>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleNameEdit}
                  >
                    Edit
                  </Button>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              {endpoint.active ? (
                <Badge variant="default">Active</Badge>
              ) : (
                <Badge variant="secondary">Inactive</Badge>
              )}
              <Button size="sm" variant="outline" onClick={handleToggleActive}>
                {endpoint.active ? "Deactivate" : "Activate"}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Webhook URL</label>
            <EndpointUrl slug={endpoint.slug} />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Requests</CardTitle>
          </CardHeader>
          <CardContent>
            {requests.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No requests yet. Send a webhook to this endpoint to see it here.</p>
              </div>
            ) : (
              <ScrollArea className="h-[600px]">
                <div className="space-y-2">
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

        <Card>
          <CardHeader>
            <CardTitle>Request Details</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedRequestId === null ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>Select a request to view details</p>
              </div>
            ) : selectedRequest === undefined ? (
              <div className="space-y-2">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-64 w-full" />
              </div>
            ) : selectedRequest === null ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>Request not found</p>
              </div>
            ) : (
              <div className="space-y-4">
                <Tabs defaultValue="headers">
                  <TabsList>
                    <TabsTrigger value="headers">Headers</TabsTrigger>
                    <TabsTrigger value="body">Body</TabsTrigger>
                  </TabsList>
                  <TabsContent value="headers" className="mt-4">
                    <ScrollArea className="h-[400px]">
                      <div className="space-y-2">
                        {Object.entries(selectedRequest.headers).map(([key, value]) => (
                          <div key={key} className="rounded-md border p-2">
                            <div className="font-mono text-sm">
                              <span className="font-semibold">{key}:</span>{" "}
                              <span className="text-muted-foreground">{value}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </TabsContent>
                  <TabsContent value="body" className="mt-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant={bodyView === "raw" ? "default" : "outline"}
                          onClick={() => setBodyView("raw")}
                        >
                          RAW
                        </Button>
                        <Button
                          size="sm"
                          variant={bodyView === "json" ? "default" : "outline"}
                          onClick={() => setBodyView("json")}
                        >
                          JSON Pretty
                        </Button>
                        <Button
                          size="sm"
                          variant={bodyView === "hex" ? "default" : "outline"}
                          onClick={() => setBodyView("hex")}
                        >
                          Hex
                        </Button>
                      </div>
                      <ScrollArea className="h-[400px]">
                        {selectedRequest.body === null ? (
                          <div className="text-muted-foreground">No body</div>
                        ) : (
                          <pre className="rounded-md border bg-muted p-4 font-mono text-sm whitespace-pre-wrap overflow-wrap-anywhere">
                            {getBodyContent(selectedRequest.body)}
                          </pre>
                        )}
                      </ScrollArea>
                    </div>
                  </TabsContent>
                </Tabs>

                <Separator />

                <div>
                  <h3 className="text-sm font-medium mb-2">Replay Request</h3>
                  <ReplayForm requestId={selectedRequestId} />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
