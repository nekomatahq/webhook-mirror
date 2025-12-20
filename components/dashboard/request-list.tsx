"use client";

import { Id } from "@/convex/_generated/dataModel";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";

interface RequestListItemProps {
  id: Id<"requests">;
  method: string;
  timestamp: number;
  bodySize: number;
  onClick: () => void;
}

export const RequestListItem = ({
  method,
  timestamp,
  bodySize,
  onClick,
}: RequestListItemProps) => {
  const methodColors: Record<string, "default" | "secondary" | "destructive"> =
    {
      GET: "default",
      POST: "secondary",
      PUT: "secondary",
      PATCH: "secondary",
      DELETE: "destructive",
    };

  const formatSize = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${Math.round((bytes / Math.pow(k, i)) * 100) / 100} ${sizes[i]}`;
  };

  return (
    <div
      onClick={onClick}
      className="flex cursor-pointer items-center justify-between rounded-md border p-3 transition-colors hover:bg-accent"
    >
      <div className="flex items-center gap-3">
        <Badge variant={methodColors[method] || "default"}>{method}</Badge>
        <span className="text-sm text-muted-foreground">
          {formatDistanceToNow(new Date(timestamp), { addSuffix: true })}
        </span>
      </div>
      <span className="text-sm text-muted-foreground">{formatSize(bodySize)}</span>
    </div>
  );
};
