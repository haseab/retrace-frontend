"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Download,
  Terminal,
  Github,
  CheckCircle2,
  Copy,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/ui/section-header";

const LATEST_VERSION = "1.0.0";
const DMG_SIZE = "45 MB";
const SHA256 = "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6";

const installationSteps = [
  {
    title: "Download Retrace",
    description: "Click the download button above to get the latest .dmg file",
  },
  {
    title: "Open the DMG",
    description: "Double-click the downloaded file to mount the disk image",
  },
  {
    title: "Drag to Applications",
    description: "Drag Retrace.app to your Applications folder",
  },
  {
    title: "Grant Permissions",
    description:
      "Open Retrace and grant Screen Recording and Accessibility permissions in System Settings",
  },
];

export default function DownloadPage() {
  const [copied, setCopied] = useState(false);
  const [copiedSha, setCopiedSha] = useState(false);

  const handleDownload = async () => {
    // Track download
    try {
      await fetch("/api/downloads/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          version: LATEST_VERSION,
          platform: "macOS",
          source: "website",
        }),
      });
    } catch (error) {
      console.error("Failed to track download:", error);
    }

    // In production, this would redirect to actual download URL
    alert(
      "Download would start here. Replace with actual CDN download URL in production."
    );
  };

  const copyToClipboard = (text: string, setter: (val: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setter(true);
    setTimeout(() => setter(false), 2000);
  };

  return (
    <div className="pt-24 pb-20">
      {/* Hero Section */}
      <section className="px-4 sm:px-6 lg:px-8 py-12">
        <div className="mx-auto max-w-4xl text-center space-y-8">
          <SectionHeader
            title="Download Retrace"
            subtitle="Get started with local-first screen recording and search for macOS"
            centered
          />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="space-y-4"
          >
            <Button
              size="lg"
              onClick={handleDownload}
              className="text-lg px-12 py-7"
            >
              <Download className="mr-2 h-5 w-5" />
              Download v{LATEST_VERSION} for macOS
            </Button>
            <div className="text-sm text-muted-foreground">
              {DMG_SIZE} • Requires macOS 13.0 or later
            </div>
          </motion.div>
        </div>
      </section>

      {/* Alternative Installation */}
      <section className="px-4 sm:px-6 lg:px-8 py-12 bg-muted/30">
        <div className="mx-auto max-w-4xl space-y-8">
          <h2 className="text-2xl font-bold text-center">
            Alternative Installation Methods
          </h2>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-lg border border-border bg-card p-6 space-y-4">
              <div className="flex items-center gap-2">
                <Terminal className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Homebrew</h3>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-md bg-muted font-mono text-sm">
                <code className="flex-1">brew install --cask retrace</code>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    copyToClipboard("brew install --cask retrace", setCopied)
                  }
                >
                  {copied ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="rounded-lg border border-border bg-card p-6 space-y-4">
              <div className="flex items-center gap-2">
                <Github className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">GitHub Releases</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Download from GitHub for all versions and release notes
              </p>
              <Button variant="outline" asChild className="w-full">
                <a
                  href="https://github.com/haseab/retrace/releases"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View Releases
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Verification */}
      <section className="px-4 sm:px-6 lg:px-8 py-12">
        <div className="mx-auto max-w-4xl space-y-6">
          <h2 className="text-2xl font-bold text-center">
            Verify Your Download
          </h2>
          <div className="rounded-lg border border-border bg-card p-6 space-y-4">
            <div>
              <h3 className="text-sm font-semibold mb-2">
                SHA-256 Checksum:
              </h3>
              <div className="flex items-center gap-2 p-3 rounded-md bg-muted font-mono text-xs break-all">
                <code className="flex-1">{SHA256}</code>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => copyToClipboard(SHA256, setCopiedSha)}
                >
                  {copiedSha ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Verify the integrity of your download by comparing the SHA-256
              checksum using:{" "}
              <code className="bg-muted px-1 py-0.5 rounded">
                shasum -a 256 Retrace-{LATEST_VERSION}.dmg
              </code>
            </p>
          </div>
        </div>
      </section>

      {/* Installation Steps */}
      <section className="px-4 sm:px-6 lg:px-8 py-12 bg-muted/30">
        <div className="mx-auto max-w-4xl space-y-8">
          <h2 className="text-2xl font-bold text-center">
            Installation Instructions
          </h2>

          <div className="space-y-4">
            {installationSteps.map((step, index) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="flex gap-4 p-6 rounded-lg border border-border bg-card"
              >
                <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-semibold">
                  {index + 1}
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-semibold">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* System Requirements */}
      <section className="px-4 sm:px-6 lg:px-8 py-12">
        <div className="mx-auto max-w-4xl space-y-6">
          <h2 className="text-2xl font-bold text-center">
            System Requirements
          </h2>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-lg border border-border bg-card p-6 space-y-4">
              <h3 className="text-lg font-semibold">Minimum Requirements</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 text-primary" />
                  macOS 13.0 (Ventura) or later
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 text-primary" />
                  4 GB RAM
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 text-primary" />
                  2 GB free disk space
                </li>
              </ul>
            </div>

            <div className="rounded-lg border border-border bg-card p-6 space-y-4">
              <h3 className="text-lg font-semibold">Recommended</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 text-primary" />
                  Apple Silicon Mac (M1 or later)
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 text-primary" />
                  8 GB RAM or more
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 text-primary" />
                  10 GB+ free disk space
                </li>
              </ul>
            </div>
          </div>

          <div className="rounded-lg border border-amber-500/50 bg-amber-500/10 p-6">
            <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
              <span className="text-amber-500">⚠️</span>
              Required Permissions
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              Retrace requires the following macOS permissions to function:
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 mt-0.5 text-amber-500" />
                <span>
                  <strong>Screen Recording:</strong> To capture your screen
                  activity
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 mt-0.5 text-amber-500" />
                <span>
                  <strong>Accessibility:</strong> For enhanced OCR and text
                  extraction
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 mt-0.5 text-amber-500" />
                <span>
                  <strong>Full Disk Access:</strong> To search and index all
                  screen content
                </span>
              </li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
