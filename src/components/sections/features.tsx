"use client";

import { FeatureCard } from "@/components/ui/feature-card";
import { SectionHeader } from "@/components/ui/section-header";
import {
  ArrowRightLeft,
  Clock,
  Code,
  HardDrive,
  Search,
  Shield,
} from "lucide-react";

const features = [
  {
    icon: Shield,
    title: "Local-First Privacy",
    description:
      "All data stays on your Mac, encrypted at rest with your device's keychain. No servers, no cloud, no third-party access.",
    available: true,
  },
  {
    icon: Search,
    title: "Intelligent Search",
    description:
      "Find anything you've seen with natural language queries. OCR and text extraction work locally on your device.",
    available: true,
    note: "Coming soon",
  },
  {
    icon: Clock,
    title: "Timeline Scrolling View",
    description:
      "Navigate your screen history with an intuitive timeline interface. Scroll through your past activity and jump to any moment instantly.",
    available: true,
  },
  {
    icon: HardDrive,
    title: "~4000x Compression",
    description:
      "Advanced compression technology means your entire screen history takes only 10-15 GB per month. Store months of data without filling your drive. Easy Exporting.",
    available: true,
    note: "Coming soon",
  },
  {
    icon: ArrowRightLeft,
    title: "Rewind Migration",
    description:
      "Seamlessly migrate your existing Rewind data to Retrace. Import your screen history and continue where you left off.",
    available: true,
  },
  {
    icon: Code,
    title: "100% Open Source",
    description:
      "MIT licensed. Audit the code yourself, verify no data leaves your Mac, and contribute improvements.",
    available: true,
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
              note={feature.note}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
