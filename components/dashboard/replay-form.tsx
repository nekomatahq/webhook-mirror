"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Id } from "@/convex/_generated/dataModel";
import { api } from "@/convex/_generated/api";
import { useAction } from "convex/react";
import { AlertCircle, CheckCircle2, Loader2, ExternalLink } from "lucide-react";

interface ReplayFormProps {
  requestId: Id<"requests">;
}

// Helper function to strip stack trace and debug information from error messages
function cleanErrorMessage(error: string): string {
  // Split by newlines and filter out stack trace lines
  const lines = error.split("\n");
  const cleanLines: string[] = [];
  
  for (const line of lines) {
    const trimmed = line.trim();
    // Skip lines that look like stack traces:
    // - Lines starting with "at " (function calls)
    // - Lines starting with "Called by"
    // - Lines containing file paths with line numbers (e.g., "file.ts:123:45")
    if (
      trimmed.startsWith("at ") ||
      trimmed.startsWith("Called by") ||
      /\.(ts|tsx|js|jsx):\d+:\d+/.test(trimmed) ||
      trimmed.includes("../../") ||
      trimmed.includes("at handler") ||
      trimmed.includes("at validateReplayUrl")
    ) {
      continue;
    }
    cleanLines.push(line);
  }
  
  return cleanLines.join("\n").trim();
}

// Helper function to parse and format error messages
function parseErrorMessage(error: string): {
  title: string;
  explanation?: string;
  suggestion?: string;
} {
  // First clean the error message
  const cleaned = cleanErrorMessage(error);
  
  // Check if it's the localhost error
  if (cleaned.includes("Cannot replay to localhost") || cleaned.includes("private IP")) {
    const parts = cleaned.split(". ");
    return {
      title: parts[0] || cleaned,
      explanation: parts[1] || undefined,
      suggestion: parts.slice(2).join(". ") || undefined,
    };
  }
  
  // For other errors, try to split by periods
  const parts = cleaned.split(". ");
  if (parts.length > 1) {
    return {
      title: parts[0],
      explanation: parts.slice(1).join(". "),
    };
  }
  
  return { title: cleaned };
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
      // Extract error message from ConvexError and clean stack traces
      let errorMessage = "Unknown error occurred";
      if (error instanceof Error) {
        errorMessage = cleanErrorMessage(error.message);
      }

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
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
                <div className="flex-1 space-y-2">
                  {(() => {
                    const parsed = parseErrorMessage(result.error);
                    return (
                      <>
                        <div>
                          <p className="text-sm font-semibold text-destructive">
                            {parsed.title}
                          </p>
                          {parsed.explanation && (
                            <p className="text-sm text-muted-foreground mt-1.5">
                              {parsed.explanation}
                            </p>
                          )}
                        </div>
                        {parsed.suggestion && (
                          <div className="rounded-md bg-muted/50 border border-border/50 p-3 space-y-1.5">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                💡 Solution
                              </span>
                            </div>
                            <p className="text-sm text-foreground leading-relaxed">
                              {parsed.suggestion}
                            </p>
                            {parsed.suggestion.toLowerCase().includes("ngrok") && (
                              <a
                                href="https://ngrok.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline mt-2"
                              >
                                Learn more about ngrok
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
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
