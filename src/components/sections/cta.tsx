"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Download, Github } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnimatedGradient } from "@/components/ui/animated-gradient";

export function CTA() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <AnimatedGradient className="absolute inset-0 -z-10" />

      <div className="mx-auto max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="relative rounded-3xl border border-border bg-card/50 backdrop-blur-sm p-12 text-center space-y-8"
        >
          <div className="space-y-4">
            <h2 className="text-4xl sm:text-5xl font-bold tracking-tight">
              Take Control of Your
              <br />
              <span className="bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600 bg-clip-text text-transparent">
                Screen History
              </span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Download Retrace today and experience truly private, local-first
              screen recording and search.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" asChild className="text-lg px-8 py-6">
              <Link href="/download">
                <Download className="mr-2 h-5 w-5" />
                Download for macOS
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              asChild
              className="text-lg px-8 py-6"
            >
              <Link href="https://github.com/haseab/retrace/" target="_blank">
                <Github className="mr-2 h-5 w-5" />
                View on GitHub
              </Link>
            </Button>
          </div>

          <div className="text-sm text-muted-foreground">
            Free and open source • No account required • No cloud signup
          </div>
        </motion.div>
      </div>
    </section>
  );
}
