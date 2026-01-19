"use client";

import { SectionHeader } from "@/components/ui/section-header";
import { motion } from "framer-motion";
import { Camera, Database, FileSearch, Sparkles } from "lucide-react";

const steps = [
  {
    icon: Camera,
    title: "Screen Capture",
    description:
      "Continuously captures your screen in the background at configurable intervals",
  },
  {
    icon: FileSearch,
    title: "Local OCR",
    description:
      "Extracts text from screenshots using on-device OCR processing",
  },
  {
    icon: Database,
    title: "Local Storage",
    description:
      "Stores everything in a SQLite database on your Mac",
  },
  {
    icon: Sparkles,
    title: "Instant Search",
    description: "Scroll through your screen history and search for anything",
  },
];

export function HowItWorks() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col items-center mb-16">
          <SectionHeader
            title="How It Works"
            subtitle="A simple, privacy-first workflow that keeps everything on your device"
            centered
          />
        </div>

        <div className="relative">
          {/* Connection line */}
          <div className="hidden lg:block absolute top-8 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-400/20 via-blue-500/20 to-blue-600/20" />

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, index) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="relative"
              >
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full blur-lg opacity-20" />
                    <div className="relative flex items-center justify-center h-16 w-16 rounded-full bg-card border-2 border-primary">
                      <step.icon className="h-8 w-8 text-primary" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm font-semibold text-primary">
                      Step {index + 1}
                    </div>
                    <h3 className="text-xl font-semibold">{step.title}</h3>
                    <p className="text-muted-foreground">{step.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
