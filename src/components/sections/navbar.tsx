"use client";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { WindowsDownloadDialog } from "@/components/ui/windows-download-dialog";
import { handleDownloadClick, isWindowsMachine } from "@/lib/track-download";
import { SITE_CONFIG } from "@/lib/config";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { Download, Menu, X, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { FaGithub } from "react-icons/fa";

const navigation = [
  { name: "Features", href: "/#features" },
  { name: "Docs", href: "/docs" },
  { name: "FAQ", href: "/faq" },
  { name: "About", href: "/about" },
  { name: "Roadmap", href: "https://retrace.featurebase.app" },
];

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [starCount, setStarCount] = useState<number | null>(null);
  const [showWindowsDialog, setShowWindowsDialog] = useState(false);

  const handleDownload = () => {
    if (isWindowsMachine()) {
      setShowWindowsDialog(true);
      return;
    }

    handleDownloadClick("navbar");
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    fetch("https://api.github.com/repos/haseab/retrace")
      .then((res) => res.json())
      .then((data) => {
        if (data.stargazers_count) {
          setStarCount(data.stargazers_count);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <TooltipProvider delayDuration={0}>
      <nav
        className={cn(
          "fixed top-0 z-50 w-full transition-all duration-1000",
          isScrolled
            ? "bg-background/80 backdrop-blur-md border-b border-border"
            : "bg-transparent"
        )}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-8">
              <Link href="/" className="flex items-center gap-1">
                <Image
                  src="/logo.svg"
                  alt="Retrace Logo"
                  width={32}
                  height={32}
                  className="h-8 w-8"
                />
                <span className="text-xl font-bold">Retrace</span>
              </Link>
              <div className="hidden md:flex md:gap-6">
                {navigation.map((item) =>
                  item.name === "Docs" ? (
                    <Tooltip key={item.name}>
                      <TooltipTrigger asChild>
                        <span
                          className="text-sm font-medium cursor-not-allowed"
                          style={{ color: "#6b7280" }}
                        >
                          {item.name}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Coming soon</p>
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                      target={
                        item.href.startsWith("http") ? "_blank" : undefined
                      }
                    >
                      {item.name}
                    </Link>
                  )
                )}
              </div>
            </div>

            <div className="hidden md:flex md:items-center md:gap-4">
              <Link
                href={SITE_CONFIG.links.github}
                target="_blank"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[hsl(var(--secondary))] hover:bg-[hsl(var(--secondary))]/80 rounded-lg border border-[hsl(var(--border))] transition-colors"
              >
                <FaGithub className="h-4 w-4" />
                <span className="text-xs font-medium">Star</span>
                {starCount !== null && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-yellow-500/20 text-yellow-400 rounded text-xs font-medium">
                    <Star className="h-3 w-3 fill-yellow-400" />
                    {starCount.toLocaleString()}
                  </span>
                )}
              </Link>
              <Button onClick={handleDownload}>
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
            </div>

            <div className="flex md:hidden gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>

          <AnimatePresence>
            {isMobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
                animate={{ opacity: 1, backdropFilter: "blur(12px)" }}
                exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
                transition={{ duration: 0.3 }}
                className="md:hidden fixed top-16 left-0 right-0 bottom-0 border-t border-border py-4 space-y-2 bg-background/95"
              >
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                  {navigation.map((item) =>
                    item.name === "Docs" ? (
                      <span
                        key={item.name}
                        className="block px-4 py-2 text-sm font-medium cursor-not-allowed"
                        style={{ color: "#6b7280" }}
                      >
                        {item.name} (Coming soon)
                      </span>
                    ) : (
                      <Link
                        key={item.name}
                        href={item.href}
                        className="block px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground hover:bg-accent rounded-md"
                        onClick={() => setIsMobileMenuOpen(false)}
                        target={
                          item.href.startsWith("http") ? "_blank" : undefined
                        }
                      >
                        {item.name}
                      </Link>
                    )
                  )}
                  <Link
                    href={SITE_CONFIG.links.github}
                    target="_blank"
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground hover:bg-accent rounded-md"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <FaGithub className="h-4 w-4" />
                    GitHub
                    {starCount !== null && (
                      <span className="flex items-center gap-1">
                        ⭐ {starCount.toLocaleString()}
                      </span>
                    )}
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <WindowsDownloadDialog
          open={showWindowsDialog}
          onOpenChange={setShowWindowsDialog}
        />
      </nav>
    </TooltipProvider>
  );
}
