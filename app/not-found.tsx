"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { motion } from "motion/react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center font-sans selection:bg-foreground/5 selection:text-foreground relative overflow-hidden bg-background">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
        className="text-center px-6"
      >
        <h1 className="text-9xl font-light text-foreground/5 mb-8 tracking-widest select-none">
          404
        </h1>
        <h2 className="text-2xl font-light text-foreground/90 mb-6 tracking-wide">
          Page not found
        </h2>
        <p className="text-muted-foreground/60 mb-12 max-w-md mx-auto leading-loose font-light">
          The page you are looking for does not exist or has been moved.
        </p>
        <Button
          asChild
          variant="outline"
          className="text-sm font-normal border-[0.5px] border-foreground/10 bg-transparent hover:bg-foreground/5 hover:text-foreground transition-all duration-700 rounded-full px-8 h-10 backdrop-blur-sm"
        >
          <Link href="/">Return Home</Link>
        </Button>
      </motion.div>
    </div>
  );
}

