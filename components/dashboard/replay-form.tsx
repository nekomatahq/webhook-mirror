"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Id } from "@/convex/_generated/dataModel";
import { api } from "@/convex/_generated/api";
import { useAction } from "convex/react";

interface ReplayFormProps {
  requestId: Id<"requests">;
}

export const ReplayForm = ({ requestId }: ReplayFormProps) => {
  const [targetUrl, setTargetUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    status: number;
    statusText: string;
    error: string | null;
  } | null>(null);

  const replayRequest = useAction(api.requests.action.replayRequest);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUrl.trim()) return;

    setLoading(true);
    setResult(null);

    try {
      const response = await replayRequest({
        requestId,
        targetUrl: targetUrl.trim(),
      });

      setResult({
        status: response.status,
        statusText: response.statusText,
        error: response.error,
      });
    } catch (error) {
      setResult({
        status: 0,
        statusText: "",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          type="url"
          placeholder="https://example.com/webhook"
          value={targetUrl}
          onChange={(e) => setTargetUrl(e.target.value)}
          className="flex-1"
          disabled={loading}
        />
        <Button type="submit" disabled={loading || !targetUrl.trim()}>
          {loading ? "Replaying..." : "Replay request"}
        </Button>
      </form>

      {result && (
        <div className="rounded-md border p-4">
          {result.error ? (
            <div className="space-y-1">
              <p className="text-sm font-medium text-destructive">Error</p>
              <p className="text-sm text-muted-foreground">{result.error}</p>
            </div>
          ) : (
            <div className="space-y-1">
              <p className="text-sm font-medium">
                Status: {result.status} {result.statusText}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
