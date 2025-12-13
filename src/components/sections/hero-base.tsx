"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Check, Copy, Download } from "lucide-react";
import { useState } from "react";

const LATEST_VERSION = "1.0.0";

interface HeroBaseProps {
  badge?: string;
  title: string;
  highlightedText: string;
  description: string;
  trackingSource: string;
}

export function HeroBase({
  badge = "🚀 Easy Migration from Rewind AI",
  title,
  highlightedText,
  description,
  trackingSource,
}: HeroBaseProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText("brew install --cask retrace");
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleDownload = async () => {
    setIsDownloading(true);

    try {
      // Track download and get download URL
      const response = await fetch("/api/downloads/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          version: LATEST_VERSION,
          platform: "macOS",
          source: trackingSource,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Trigger download directly
        if (data.downloadUrl) {
          window.location.href = data.downloadUrl;
        } else {
          // Fallback: redirect to GitHub releases
          window.open("https://github.com/haseab/retrace/releases", "_blank");
        }
      } else {
        // If tracking fails, still allow download
        window.open("https://github.com/haseab/retrace/releases", "_blank");
      }
    } catch (error) {
      console.error("Failed to track download:", error);
      // On error, still allow download via GitHub
      window.open("https://github.com/haseab/retrace/releases", "_blank");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-[#0e2c6b] to-[var(--deep-blue)]" />

      <div className="relative z-10 mx-auto max-w-7xl w-full py-20">
        <div className="text-center space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500/20 text-sm sm:text-base px-4 py-1.5">
              {badge}
            </Badge>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight"
          >
            {title}
            <br />
            <span className="bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600 bg-clip-text text-transparent">
              {highlightedText}
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto"
          >
            {description}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col items-center justify-center gap-3 pt-4"
          >
            <div className="relative w-full max-w-xs">
              <Button
                size="lg"
                variant="outline"
                onClick={handleDownload}
                disabled={isDownloading}
                className="text-lg px-8 py-6 rounded-xl hover:bg-blue-500/10 transition-all border-0 w-full"
              >
                <Download className="mr-2 h-5 w-5" />
                {isDownloading ? "Starting Download..." : "Download Retrace v0.1"}
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

            <div className="flex items-center gap-3 w-full max-w-xs">
              <div className="flex-1 h-px bg-white/10" />
              <p className="text-sm text-muted-foreground">OR</p>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            <div className="group relative inline-flex items-center gap-2 rounded-xl bg-card/30 backdrop-blur-sm border border-white/5 px-4 py-2 w-full max-w-xs">
              <code className="text-sm text-muted-foreground">
                <span className="text-blue-400">$</span> brew install --cask
                retrace
              </code>
              <button
                onClick={handleCopy}
                className="ml-2 p-1 rounded hover:bg-white/10 transition-colors"
                aria-label="Copy to clipboard"
              >
                {isCopied ? (
                  <Check className="h-4 w-4 text-green-400" />
                ) : (
                  <Copy className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
            </div>

            <p className="text-sm sm:text-base text-muted-foreground mt-2">
              macOS 13.0+ • Apple Silicon Recommended
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
