"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Webhook, Eye, RotateCcw, CheckCircle2, XCircle } from "lucide-react";
import { motion, Variants } from "motion/react";

export default function Home() {
  const router = useRouter();
  const user = useQuery(api.users.query.getMe);

  useEffect(() => {
    if (user !== undefined && user !== null) {
      router.replace("/dashboard");
    }
  }, [user, router]);

  const fadeUp: Variants = {
    hidden: { opacity: 0, y: 10 },
    visible: (custom: number) => ({
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: "easeOut", delay: custom * 0.2 },
    }),
  };

  return (
    <div className="min-h-screen flex flex-col font-sans selection:bg-foreground/5 selection:text-foreground">
      {/* Hero Section */}
      <section className="pt-40 pb-32 px-6 sm:px-12 max-w-5xl mx-auto w-full">
        <motion.div
          initial="hidden"
          animate="visible"
          custom={0}
          variants={fadeUp}
        >
          <h1 className="text-4xl sm:text-5xl font-light text-foreground/90 mb-10 tracking-wide leading-[1.3]">
            Inspect and replay webhooks
            <br />
            without guesswork.
          </h1>
        </motion.div>
        <motion.div
          initial="hidden"
          animate="visible"
          custom={1}
          variants={fadeUp}
        >
          <p className="text-lg sm:text-xl text-muted-foreground/80 mb-16 max-w-2xl leading-loose font-light">
            Generate temporary webhook endpoints. Capture incoming HTTP requests.
            Replay them to debug integrations.
            <span className="block mt-4 text-sm tracking-widest uppercase opacity-60">
              Capture — Inspect — Replay
            </span>
          </p>
        </motion.div>
        <motion.div
          initial="hidden"
          animate="visible"
          custom={2}
          variants={fadeUp}
        >
          <Button
            asChild
            variant="outline"
            size="lg"
            className="text-sm font-normal border-[0.5px] border-foreground/20 hover:bg-foreground/5 hover:text-foreground transition-all duration-500 rounded-full px-8 h-12"
          >
            <Link href="/dashboard/billing">Get full access</Link>
          </Button>
        </motion.div>
      </section>

      {/* How It Works */}
      <section className="py-32 px-6 sm:px-12 max-w-5xl mx-auto w-full border-t border-border/30">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 1 }}
        >
          <h2 className="text-sm font-normal text-muted-foreground/60 tracking-widest uppercase mb-20 ml-1">
            How it works
          </h2>
        </motion.div>

        <div className="grid sm:grid-cols-3 gap-16 sm:gap-12">
          {[
            {
              icon: Webhook,
              title: "Generate URL",
              desc: "Create a temporary endpoint that captures incoming HTTP requests instantly.",
            },
            {
              icon: Eye,
              title: "Send Events",
              desc: "Configure your services to send webhooks to the generated URL.",
            },
            {
              icon: RotateCcw,
              title: "Inspect & Replay",
              desc: "View headers and payloads. Replay requests to another endpoint for debugging.",
            },
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: i * 0.2, ease: "easeOut" }}
              className="group flex flex-col gap-6"
            >
              <div className="w-10 h-10 rounded-full border-[0.5px] border-foreground/10 flex items-center justify-center bg-transparent group-hover:border-foreground/20 transition-colors duration-500">
                <item.icon
                  strokeWidth={1}
                  className="w-5 h-5 text-foreground/70"
                />
              </div>
              <div>
                <h3 className="text-base font-medium text-foreground/90 mb-3">
                  {item.title}
                </h3>
                <p className="text-muted-foreground/70 text-sm leading-loose font-light">
                  {item.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* What Webhook Mirror Is For */}
      <section className="py-32 px-6 sm:px-12 max-w-5xl mx-auto w-full border-t border-border/30">
        <div className="grid md:grid-cols-2 gap-20">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
          >
            <h2 className="text-sm font-normal text-muted-foreground/60 tracking-widest uppercase mb-8 sticky top-32">
              Purpose
            </h2>
          </motion.div>

          <div className="space-y-12">
            {[
              "Debugging webhook payloads and understanding what services send.",
              "Replaying failed events to test your integration logic.",
              "Inspecting headers and request bodies without logging infrastructure.",
            ].map((text, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: i * 0.1 }}
                className="flex items-start gap-6 group"
              >
                <CheckCircle2
                  strokeWidth={1}
                  className="w-5 h-5 text-foreground/40 mt-1 shrink-0 group-hover:text-foreground/60 transition-colors duration-500"
                />
                <p className="text-foreground/80 leading-loose font-light">
                  {text}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* What It Is Not */}
      <section className="py-32 px-6 sm:px-12 max-w-5xl mx-auto w-full border-t border-border/30">
        <div className="grid md:grid-cols-2 gap-20">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
          >
            <h2 className="text-sm font-normal text-muted-foreground/60 tracking-widest uppercase mb-8 sticky top-32">
              Non-Goals
            </h2>
          </motion.div>

          <div className="space-y-12">
            {[
              "Not a reliability or retry service.",
              "Not an analytics platform.",
              "No delivery guarantees or long-term storage.",
            ].map((text, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: i * 0.1 }}
                className="flex items-start gap-6 group"
              >
                <XCircle
                  strokeWidth={1}
                  className="w-5 h-5 text-muted-foreground/30 mt-1 shrink-0 group-hover:text-muted-foreground/50 transition-colors duration-500"
                />
                <p className="text-muted-foreground/70 leading-loose font-light">
                  {text}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Suite Context */}
      <section className="py-32 px-6 sm:px-12 max-w-5xl mx-auto w-full">
        <div className="border-t border-border/30 pt-16">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.2 }}
            className="text-muted-foreground/50 text-sm leading-relaxed text-center font-light tracking-wide"
          >
            Part of the Nekomata Suite.
          </motion.p>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-12 px-6 sm:px-12 border-t border-border/30">
        <div className="max-w-5xl mx-auto w-full flex justify-between items-center">
          <nav className="flex gap-8 text-xs sm:text-sm tracking-wide">
            <Link
              href="https://nekomata.com"
              className="text-muted-foreground/60 hover:text-foreground transition-colors duration-300"
            >
              Back to Nekomata
            </Link>
            <Link
              href="/terms"
              className="text-muted-foreground/60 hover:text-foreground transition-colors duration-300"
            >
              Terms
            </Link>
            <Link
              href="/privacy"
              className="text-muted-foreground/60 hover:text-foreground transition-colors duration-300"
            >
              Privacy
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
