"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Download, Github } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CTA() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden" style={{ backgroundColor: 'var(--deep-blue)' }}>

      <div className="mx-auto max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="relative rounded-3xl border-2 border-white/10 bg-card/50 backdrop-blur-sm p-12 text-center space-y-8"
        >
          <div className="space-y-4">
            <h2 className="text-4xl sm:text-5xl font-bold tracking-tight">
              <span className="bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600 bg-clip-text text-transparent">
                Download for Free
              </span>
            </h2>
          </div>

          <div className="flex flex-col items-center justify-center gap-4">
            <div className="relative">
              <Button
                size="lg"
                variant="outline"
                asChild
                className="text-lg px-8 py-6 rounded-xl hover:bg-blue-500/10 transition-all border-0"
              >
                <Link href="/download">
                  <Download className="mr-2 h-5 w-5" />
                  Download for macOS
                </Link>
              </Button>
              <div
                className="absolute inset-0 rounded-xl border-2 pointer-events-none"
                style={{
                  borderColor: '#3b82f6',
                  animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
                }}
              />
              <style jsx>{`
                @keyframes pulse {
                  0%, 100% {
                    opacity: 1;
                  }
                  50% {
                    opacity: 0.3;
                  }
                }
              `}</style>
            </div>
            <Button
              size="lg"
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
