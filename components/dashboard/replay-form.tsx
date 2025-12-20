"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Id } from "@/convex/_generated/dataModel";
import { api } from "@/convex/_generated/api";
import { useAction } from "convex/react";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

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
    } catch (error: any) {
      // Extract error message from ConvexError
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";

      setResult({
        status: 0,
        statusText: "",
        error: errorMessage,
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
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Replaying...
            </>
          ) : (
            "Replay request"
          )}
        </Button>
      </form>

      {result && (
        <div
          className={`rounded-lg border p-4 ${
            result.error
              ? "border-destructive bg-destructive/5"
              : "border-green-500/50 bg-green-50 dark:bg-green-950/20"
          }`}
        >
          {result.error ? (
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-destructive">
                  {result.error}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-green-700 dark:text-green-300">
                  Request sent successfully
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Status: <span className="font-mono font-medium">{result.status}</span>{" "}
                  {result.statusText}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
