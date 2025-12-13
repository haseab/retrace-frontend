"use client";

import { motion } from "framer-motion";
import { Play } from "lucide-react";

export function DemoVideo() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="space-y-8"
        >
          <div className="text-center space-y-4">
            <h2 className="text-3xl sm:text-5xl font-bold tracking-tight">
              See Retrace in Action
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Watch how Retrace helps you find anything you've seen on your
              screen
            </p>
          </div>

          <div className="relative aspect-video rounded-2xl border-2 border-primary/20 bg-card/50 backdrop-blur-sm overflow-hidden">
            {/* Placeholder for video */}
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-950/50 to-blue-900/30">
              <div className="text-center space-y-4">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 border-2 border-primary">
                  <Play className="h-8 w-8 text-primary ml-1" />
                </div>
                <p className="text-lg text-muted-foreground">
                  Demo video coming soon
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
