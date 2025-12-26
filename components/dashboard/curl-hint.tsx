"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { X, Check, Copy } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";

interface CurlHintProps {
  slug: string;
}

export const CurlHint = ({ slug }: CurlHintProps) => {
  const [showCurlHint, setShowCurlHint] = useState(false);
  const [copyState, setCopyState] = useState<"idle" | "copied_eng" | "copied_jp">("idle");

  useEffect(() => {
    const hintDismissed = localStorage.getItem("webhook-curl-hint-dismissed");
    if (!hintDismissed) {
      setShowCurlHint(true);
    }
  }, []);

  const handleDismissCurlHint = () => {
    localStorage.setItem("webhook-curl-hint-dismissed", "true");
    setShowCurlHint(false);
  };

  const getCurlCommand = () => {
    const baseUrl = typeof window !== "undefined" 
      ? `${window.location.protocol}//${window.location.host}` 
      : "";
    const webhookUrl = `${baseUrl}/api/webhook/${slug}`;
    return `curl -X POST ${webhookUrl} \\
  -H "Content-Type: application/json" \\
  -d '{
    "event": "test.webhook",
    "id": "evt_123",
    "timestamp": "'"$(date -u +"%Y-%m-%dT%H:%M:%SZ")"'",
    "data": {
      "message": "hello from curl",
      "author": "nekomata (ฅ^•ﻌ•^ฅ)"
    }
  }'`;
  };

  const handleCopy = async () => {
    if (copyState !== "idle") return;

    await navigator.clipboard.writeText(getCurlCommand());
    setCopyState("copied_eng");

    // After 1 second, switch to Japanese
    setTimeout(() => {
      setCopyState("copied_jp");
      
      // After another 2 seconds, revert to idle
      setTimeout(() => {
        setCopyState("idle");
      }, 2000);
    }, 1000);
  };

  if (!showCurlHint) return null;

  return (
    <Card className="border-[0.5px] border-border/60 bg-muted/30">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            <p className="text-sm font-medium">Test your webhook</p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Use curl to send a test request to your endpoint:
            </p>
            <div className="relative">
              <pre className="rounded-md bg-background border border-border/60 p-3 pr-24 text-xs font-mono overflow-x-auto whitespace-pre-wrap">
                <code>{getCurlCommand()}</code>
              </pre>
              <div className="absolute top-2 right-2">
                <motion.button
                  layout
                  className={cn(buttonVariants({ variant: "outline", size: "sm" }), "overflow-hidden")}
                  onClick={handleCopy}
                  transition={{
                    layout: { type: "spring", stiffness: 500, damping: 30 }
                  }}
                >
                  <AnimatePresence mode="wait" initial={false}>
                    {copyState === "idle" && (
                      <motion.div
                        key="idle"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="flex items-center gap-2"
                      >
                        <Copy className="size-4" />
                        <span>Copy</span>
                      </motion.div>
                    )}
                    {copyState === "copied_eng" && (
                      <motion.div
                        key="copied_eng"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="flex items-center gap-2"
                      >
                        <Check className="size-4" />
                        <span>Copied</span>
                      </motion.div>
                    )}
                    {copyState === "copied_jp" && (
                      <motion.div
                        key="copied_jp"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="flex items-center gap-2"
                      >
                        <Check className="size-4" />
                        <span>コピーしました</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.button>
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 shrink-0"
            onClick={handleDismissCurlHint}
            aria-label="Dismiss hint"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
