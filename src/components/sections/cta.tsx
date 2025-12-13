"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Download, Github } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function CTA() {
  return (
    <TooltipProvider delayDuration={0}>
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
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Button
                      size="lg"
                      variant="outline"
                      disabled
                      className="text-lg px-8 py-6 rounded-xl transition-all border-0 cursor-not-allowed opacity-50"
                    >
                      <Download className="mr-2 h-5 w-5" />
                      Download for macOS
                    </Button>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Available Dec 19</p>
                </TooltipContent>
              </Tooltip>
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
    </TooltipProvider>
  );
}
