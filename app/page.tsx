"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Webhook, Eye, RotateCcw, CheckCircle2, XCircle } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const user = useQuery(api.users.query.getMe);

  useEffect(() => {
    if (user !== undefined && user !== null) {
      router.replace("/dashboard");
    }
  }, [user, router]);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full pl-8 sm:pl-12">
        <h1 className="text-4xl sm:text-5xl font-medium text-foreground mb-8 tracking-tight leading-[1.2]">
          Inspect and replay webhooks without guesswork.
        </h1>
        <p className="text-lg sm:text-xl text-muted-foreground mb-10 max-w-2xl leading-relaxed">
          Generate temporary webhook endpoints, capture incoming requests, and
          replay them to debug integrations. Capture → inspect → replay.
        </p>
        <Button asChild size="lg" className="text-base border-[0.5px]">
          <Link href="/dashboard/billing">Get full access</Link>
        </Button>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full pl-8 sm:pl-12">
        <h2 className="text-2xl sm:text-3xl font-medium text-foreground mb-16">
          How it works
        </h2>
        <div className="grid sm:grid-cols-3 gap-10">
          <div className="flex flex-col gap-4">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-1">
              <Webhook className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-medium text-foreground">
              Generate a webhook URL
            </h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Create a temporary endpoint that captures incoming HTTP requests.
            </p>
          </div>
          <div className="flex flex-col gap-4">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-1">
              <Eye className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-medium text-foreground">
              Send events to it
            </h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Configure your services to send webhooks to the generated URL.
            </p>
          </div>
          <div className="flex flex-col gap-4">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-1">
              <RotateCcw className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-medium text-foreground">
              Inspect and replay requests
            </h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              View headers, payloads, and timestamps. Replay requests to
              another endpoint for debugging.
            </p>
          </div>
        </div>
      </section>

      {/* What Webhook Mirror Is For */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full pl-8 sm:pl-12">
        <h2 className="text-2xl sm:text-3xl font-medium text-foreground mb-12">
          What Webhook Mirror is for
        </h2>
        <div className="space-y-5">
          <div className="flex items-start gap-4">
            <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 shrink-0" />
            <p className="text-muted-foreground leading-relaxed">
              Debugging webhook payloads and understanding what services send
            </p>
          </div>
          <div className="flex items-start gap-4">
            <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 shrink-0" />
            <p className="text-muted-foreground leading-relaxed">
              Replaying failed events to test your integration logic
            </p>
          </div>
          <div className="flex items-start gap-4">
            <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 shrink-0" />
            <p className="text-muted-foreground leading-relaxed">
              Inspecting headers and request bodies without logging infrastructure
            </p>
          </div>
        </div>
      </section>

      {/* What It Is Not */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full pl-8 sm:pl-12">
        <h2 className="text-2xl sm:text-3xl font-medium text-foreground mb-12">
          What it is not
        </h2>
        <div className="space-y-5">
          <div className="flex items-start gap-4">
            <XCircle className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" />
            <p className="text-muted-foreground leading-relaxed">
              Not a reliability or retry service
            </p>
          </div>
          <div className="flex items-start gap-4">
            <XCircle className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" />
            <p className="text-muted-foreground leading-relaxed">
              Not an analytics platform
            </p>
          </div>
          <div className="flex items-start gap-4">
            <XCircle className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" />
            <p className="text-muted-foreground leading-relaxed">
              No delivery guarantees or long-term storage
            </p>
          </div>
        </div>
      </section>

      {/* Suite Context */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full pl-8 sm:pl-12">
        <div className="border-t border-border/60 pt-10">
          <p className="text-muted-foreground leading-relaxed">
            Webhook Mirror is included in the Nekomata Suite.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-10 px-4 sm:px-6 lg:px-8 border-t border-border/60">
        <div className="max-w-4xl mx-auto w-full">
          <nav className="flex flex-wrap gap-6 text-sm">
            <Link
              href="https://nekomata.com"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Back to Nekomata
            </Link>
            <Link
              href="/terms"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Terms
            </Link>
            <Link
              href="/privacy"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Privacy
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
