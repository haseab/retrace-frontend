"use client";

import { Shield, Search, HardDrive, Lock, Zap, Code } from "lucide-react";
import { FeatureCard } from "@/components/ui/feature-card";
import { SectionHeader } from "@/components/ui/section-header";

const features = [
  {
    icon: Shield,
    title: "Local-First Privacy",
    description:
      "All data stays on your Mac, encrypted at rest with your device's keychain. No servers, no cloud, no third-party access.",
  },
  {
    icon: Search,
    title: "Intelligent Search",
    description:
      "Find anything you've seen with natural language queries. OCR and text extraction work locally on your device.",
  },
  {
    icon: HardDrive,
    title: "Zero Cloud Dependency",
    description:
      "Everything runs on your Mac. No internet connection required after installation. Your data never leaves your device.",
  },
  {
    icon: Lock,
    title: "End-to-End Encrypted",
    description:
      "Screen captures and extracted text are encrypted using your Mac's secure keychain. Only you have access.",
  },
  {
    icon: Zap,
    title: "Lightning Fast",
    description:
      "Optimized for Apple Silicon with efficient background processing. Minimal battery and CPU usage.",
  },
  {
    icon: Code,
    title: "100% Open Source",
    description:
      "GPL v3 licensed. Audit the code yourself, verify no data leaves your Mac, and contribute improvements.",
  },
];

export function Features() {
  return (
    <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col items-center mb-16">
          <SectionHeader
            title="Built for Privacy"
            subtitle="Local-first architecture means your screen history never leaves your Mac. No cloud uploads, no tracking, no compromises."
            centered
          />
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <FeatureCard
              key={feature.title}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              delay={index * 0.1}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
