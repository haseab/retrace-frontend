"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Circle, Clock } from "lucide-react";
import { SectionHeader } from "@/components/ui/section-header";

const roadmapItems = {
  inProgress: [
    {
      title: "Semantic Search with Embeddings",
      description:
        "Add AI-powered semantic search to find content by meaning, not just keywords",
      status: "in-progress",
    },
    {
      title: "Timeline Visualization",
      description:
        "Visual timeline view to browse your screen history chronologically",
      status: "in-progress",
    },
  ],
  planned: [
    {
      title: "Advanced Filters",
      description:
        "Filter search results by app, date range, screen number, and more",
      status: "planned",
    },
    {
      title: "Smart Collections",
      description:
        "Automatically group related screen captures into searchable collections",
      status: "planned",
    },
    {
      title: "Export to Markdown",
      description:
        "Export search results and screen history as markdown documents",
      status: "planned",
    },
    {
      title: "Keyboard Shortcuts",
      description: "Global hotkeys for quick search and pause/resume recording",
      status: "planned",
    },
    {
      title: "Multi-language OCR",
      description:
        "Support for OCR in languages beyond English (Chinese, Japanese, Spanish, etc.)",
      status: "planned",
    },
  ],
  underConsideration: [
    {
      title: "Browser Extension",
      description:
        "Capture and search browser history with better context than screen recording alone",
      status: "considering",
    },
    {
      title: "Mobile Companion App",
      description:
        "iOS app to search your Mac's screen history from your phone (requires local network)",
      status: "considering",
    },
    {
      title: "Rewind AI Import",
      description:
        "Tool to migrate your data from Rewind AI to Retrace (if requested by community)",
      status: "considering",
    },
    {
      title: "Plugin System",
      description:
        "Allow third-party plugins to extend Retrace functionality",
      status: "considering",
    },
  ],
  completed: [
    {
      title: "Basic Screen Recording",
      description: "Continuous screen capture with configurable frequency",
      status: "completed",
      version: "v1.0.0",
    },
    {
      title: "Local OCR",
      description: "On-device text extraction from screen captures",
      status: "completed",
      version: "v1.0.0",
    },
    {
      title: "Natural Language Search",
      description: "Search screen history with natural language queries",
      status: "completed",
      version: "v1.0.0",
    },
    {
      title: "Encrypted Storage",
      description: "All data encrypted at rest with macOS keychain",
      status: "completed",
      version: "v1.0.0",
    },
  ],
};

const StatusIcon = ({ status }: { status: string }) => {
  switch (status) {
    case "completed":
      return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    case "in-progress":
      return <Clock className="h-5 w-5 text-blue-500 animate-pulse" />;
    default:
      return <Circle className="h-5 w-5 text-muted-foreground" />;
  }
};

const StatusBadge = ({ status, version }: { status: string; version?: string }) => {
  const colors = {
    completed: "bg-green-500/10 text-green-500 border-green-500/20",
    "in-progress": "bg-blue-500/10 text-blue-500 border-blue-500/20",
    planned: "bg-purple-500/10 text-purple-500 border-purple-500/20",
    considering: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  };

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${
        colors[status as keyof typeof colors]
      }`}
    >
      {status === "completed" && version ? version : status.replace("-", " ")}
    </span>
  );
};

export default function RoadmapPage() {
  return (
    <div className="pt-24 pb-20">
      <section className="px-4 sm:px-6 lg:px-8 py-12">
        <div className="mx-auto max-w-5xl space-y-12">
          <SectionHeader
            title="Roadmap"
            subtitle="See what we're building and what's coming next for Retrace"
            centered
          />

          {/* In Progress */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Clock className="h-6 w-6 text-blue-500" />
              In Progress
            </h2>
            <div className="grid gap-4">
              {roadmapItems.inProgress.map((item, index) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="rounded-lg border-2 border-blue-500/20 bg-blue-500/5 p-6 space-y-3"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <StatusIcon status={item.status} />
                      <div className="space-y-2">
                        <h3 className="text-lg font-semibold">{item.title}</h3>
                        <p className="text-muted-foreground">
                          {item.description}
                        </p>
                      </div>
                    </div>
                    <StatusBadge status={item.status} />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Planned */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Circle className="h-6 w-6 text-purple-500" />
              Planned
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              {roadmapItems.planned.map((item, index) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="rounded-lg border border-border bg-card p-6 space-y-3 hover:border-purple-500/50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <StatusIcon status={item.status} />
                    <div className="space-y-2 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-lg font-semibold">{item.title}</h3>
                        <StatusBadge status={item.status} />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Under Consideration */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Circle className="h-6 w-6 text-amber-500" />
              Under Consideration
            </h2>
            <p className="text-muted-foreground">
              Features we're exploring based on community feedback. Vote on
              Featurebase to help prioritize!
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              {roadmapItems.underConsideration.map((item, index) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="rounded-lg border border-border bg-card p-6 space-y-3 hover:border-amber-500/50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <StatusIcon status={item.status} />
                    <div className="space-y-2 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-lg font-semibold">{item.title}</h3>
                        <StatusBadge status={item.status} />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Completed */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <CheckCircle2 className="h-6 w-6 text-green-500" />
              Completed
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              {roadmapItems.completed.map((item, index) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="rounded-lg border border-border bg-card p-6 space-y-3 opacity-75"
                >
                  <div className="flex items-start gap-3">
                    <StatusIcon status={item.status} />
                    <div className="space-y-2 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-lg font-semibold">{item.title}</h3>
                        <StatusBadge status={item.status} version={item.version} />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="rounded-xl border border-border bg-card p-8 text-center space-y-4"
          >
            <h2 className="text-2xl font-bold">Have a Feature Request?</h2>
            <p className="text-muted-foreground">
              We'd love to hear your ideas! Visit Featurebase to
              suggest features or vote on existing proposals.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="https://retrace.featurebase.app"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline font-medium"
              >
                Visit Featurebase →
              </a>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
