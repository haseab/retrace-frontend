"use client";

import { Badge } from "@/components/ui/badge";
import { DownloadButton } from "@/components/ui/download-button";
import { TooltipProvider } from "@/components/ui/tooltip";
import { motion } from "framer-motion";
import { Copy, Check, Share } from "lucide-react";
import { useState } from "react";
import { DOWNLOAD_URL } from "@/lib/track-download";

interface HeroBaseProps {
  badge?: string;
  title: string;
  highlightedText: string;
  description: string;
  mobileDescription?: string;
  trackingSource: string;
}

export function HeroBase({
  badge = "🚀 Easy Migration from Rewind AI",
  title,
  highlightedText,
  description,
  mobileDescription,
  trackingSource: _trackingSource,
}: HeroBaseProps) {
  const [copied, setCopied] = useState(false);
  const [mobileLinkCopied, setMobileLinkCopied] = useState(false);
  const [mobileLinkShared, setMobileLinkShared] = useState(false);
  const [showCopyToast, setShowCopyToast] = useState(false);

  const handleCopyDownloadLink = async () => {
    try {
      await navigator.clipboard.writeText(DOWNLOAD_URL);
      setMobileLinkCopied(true);
      setShowCopyToast(true);
      setTimeout(() => setMobileLinkCopied(false), 2000);
      setTimeout(() => setShowCopyToast(false), 2600);
    } catch (error) {
      console.error("Failed to copy download link:", error);
    }
  };

  const handleShareLink = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: "Retrace Download",
          text: "Install Retrace on your Mac",
          url: DOWNLOAD_URL,
        });
      } else {
        await navigator.clipboard.writeText(DOWNLOAD_URL);
        setMobileLinkCopied(true);
        setTimeout(() => setMobileLinkCopied(false), 2000);
      }

      setMobileLinkShared(true);
      setTimeout(() => setMobileLinkShared(false), 2000);
    } catch (error) {
      // Ignore canceled share sheet; only log actual failures.
      if (!(error instanceof DOMException && error.name === "AbortError")) {
        console.error("Failed to share download link:", error);
      }
    }
  };

  return (
    <TooltipProvider delayDuration={0}>
      <section className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0e2c6b] to-[var(--deep-blue)]" />

        <div className="relative z-10 mx-auto max-w-7xl w-full py-20">
          <div className="pointer-events-none fixed inset-x-4 bottom-6 z-20 sm:hidden">
            <div
              className={`mx-auto max-w-xs rounded-2xl border border-white/15 bg-[#0b1736]/90 px-4 py-3 text-sm font-medium text-white shadow-lg backdrop-blur transition-all duration-200 ${
                showCopyToast
                  ? "translate-y-0 opacity-100"
                  : "translate-y-2 opacity-0"
              }`}
              role="status"
              aria-live="polite"
            >
              Now press paste on your MacBook.
            </div>
          </div>

          <div className="text-center space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500/20 text-xs sm:text-sm md:text-base px-3 sm:px-4 py-1 sm:py-1.5">
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
              className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto"
            >
              <span className="sm:hidden">{mobileDescription}</span>
              <span className="hidden sm:inline">{description}</span>
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col items-center justify-center gap-3 pt-4"
            >
              <div className="flex sm:hidden w-full max-w-xs flex-col gap-3">
                <button
                  type="button"
                  onClick={handleCopyDownloadLink}
                  className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-card/30 px-5 py-4 text-base font-medium text-white backdrop-blur-sm transition-colors hover:border-white/20 hover:bg-card/40"
                >
                  {mobileLinkCopied ? (
                    <Check className="h-5 w-5 text-green-400" />
                  ) : (
                    <Copy className="h-5 w-5" />
                  )}
                  {mobileLinkCopied ? "Link copied" : "Copy download link"}
                </button>

                <button
                  type="button"
                  onClick={handleShareLink}
                  className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-card/30 px-5 py-4 text-base font-medium text-white backdrop-blur-sm transition-colors hover:border-white/20 hover:bg-card/40"
                >
                  {mobileLinkShared ? (
                    <Check className="h-5 w-5 text-green-400" />
                  ) : (
                    <Share className="h-5 w-5" />
                  )}
                  {mobileLinkShared ? "Link shared" : "Share link"}
                </button>
              </div>

              <div className="relative w-full max-w-xs">
                <DownloadButton text="Download Retrace v0.8.5" />
              </div>

              <div className="hidden sm:flex items-center gap-3 w-full max-w-xs">
                <div className="flex-1 h-px bg-white/10" />
                <p className="text-sm text-muted-foreground">OR</p>
                <div className="flex-1 h-px bg-white/10" />
              </div>

              <TooltipProvider delayDuration={0}>
                <div
                  className="hidden sm:flex group relative items-center gap-2 rounded-xl bg-card/30 backdrop-blur-sm border border-white/5 px-4 py-2 w-full max-w-xs hover:border-white/10 transition-colors"
                >
                  <code className="text-sm text-muted-foreground">
                    <span className="text-blue-400">$</span> brew install --cask
                    retrace
                  </code>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText("brew install --cask retrace");
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className="ml-2 p-1 rounded hover:bg-white/10 transition-colors"
                    aria-label="Copy to clipboard"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-400" />
                    ) : (
                      <Copy className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>
                </div>
              </TooltipProvider>

              <p className="text-sm sm:text-base text-muted-foreground mt-2">
                macOS 13.0+ • Apple Silicon
              </p>
            </motion.div>
          </div>
        </div>
      </section>
    </TooltipProvider>
  );
}
