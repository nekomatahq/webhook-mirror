"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ArrowLeft } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col font-sans selection:bg-foreground/5 selection:text-foreground bg-background">
      <div className="max-w-3xl mx-auto w-full px-6 sm:px-12 py-32">
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
          className="mb-16"
        >
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-muted-foreground/60 hover:text-foreground transition-colors duration-500 text-sm font-light tracking-wide group"
          >
            <ArrowLeft className="w-4 h-4 opacity-50 group-hover:-translate-x-1 transition-transform duration-500" strokeWidth={1} />
            Back to Home
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
        >
          <h1 className="text-3xl sm:text-4xl font-light text-foreground/90 mb-20 tracking-wide">
            Terms of Service
          </h1>

          <div className="space-y-16 text-muted-foreground/80 font-light leading-loose">
            <section>
              <h2 className="text-foreground/90 text-lg font-normal mb-6 tracking-wide">
                Usage Limits
              </h2>
              <p>
                Webhook Mirror is a developer tool. We reserve the right to limit request rates, payload sizes, and storage duration to ensure service stability for all users. Excessive usage may result in temporary or permanent restrictions.
              </p>
            </section>

            <section>
              <h2 className="text-foreground/90 text-lg font-normal mb-6 tracking-wide">
                Prohibited Content
              </h2>
              <p>
                You may not use this service to capture, store, or replay illegal, malicious, or abusive content. We actively monitor for abuse and will terminate access for violations.
              </p>
            </section>

            <section>
              <h2 className="text-foreground/90 text-lg font-normal mb-6 tracking-wide">
                Disclaimer
              </h2>
              <p>
                The service is provided "as is" without warranties of any kind. We do not guarantee 100% uptime or data durability. Do not use Webhook Mirror for critical production data or long-term storage.
              </p>
            </section>

            <section>
              <h2 className="text-foreground/90 text-lg font-normal mb-6 tracking-wide">
                Changes
              </h2>
              <p>
                We may modify these terms at any time. Continued use of the service constitutes acceptance of the new terms.
              </p>
            </section>
          </div>

          <div className="mt-32 pt-12 border-t border-foreground/5 text-xs text-muted-foreground/40 uppercase tracking-widest">
            Last updated: December 2025
          </div>
        </motion.div>
      </div>
    </div>
  );
}

