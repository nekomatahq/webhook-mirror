"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPage() {
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
            Privacy Policy
          </h1>

          <div className="space-y-16 text-muted-foreground/80 font-light leading-loose">
            <section>
              <h2 className="text-foreground/90 text-lg font-normal mb-6 tracking-wide">
                Data Collection
              </h2>
              <p>
                We collect minimal data necessary to operate the service. This includes IP addresses for rate limiting and request logs for your inspection. We do not track your activity across other sites.
              </p>
            </section>

            <section>
              <h2 className="text-foreground/90 text-lg font-normal mb-6 tracking-wide">
                Data Retention
              </h2>
              <p>
                Webhook requests captured by our service are temporary. They are stored for a short period to allow inspection and replay, after which they are permanently deleted. We do not offer long-term storage guarantees.
              </p>
            </section>

            <section>
              <h2 className="text-foreground/90 text-lg font-normal mb-6 tracking-wide">
                Third Parties
              </h2>
              <p>
                We do not sell your data. We use trusted infrastructure providers to host our services and database. These providers adhere to strict security and privacy standards.
              </p>
            </section>

            <section>
              <h2 className="text-foreground/90 text-lg font-normal mb-6 tracking-wide">
                Contact
              </h2>
              <p>
                For privacy-related inquiries, please contact us at privacy@nekomata.com.
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

