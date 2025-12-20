"use client";

import { CopyButton } from "./copy-button";

interface EndpointUrlProps {
  slug: string;
  className?: string;
}

export const EndpointUrl = ({ slug, className }: EndpointUrlProps) => {
  const baseUrl =
    typeof window !== "undefined"
      ? `${window.location.protocol}//${window.location.host}`
      : "";
  const webhookUrl = `${baseUrl}/api/webhook/${slug}`;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <code className="flex-1 rounded-md bg-muted px-3 py-2 font-mono text-sm">
        {webhookUrl}
      </code>
      <CopyButton text={webhookUrl} />
    </div>
  );
};
