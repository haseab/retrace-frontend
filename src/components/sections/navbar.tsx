"use client";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { SITE_CONFIG } from "@/lib/config";
import { cn } from "@/lib/utils";
import { Download, Menu, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { FaGithub } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

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

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
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
              <Button variant="ghost" size="icon" asChild>
                <Link href={SITE_CONFIG.links.github} target="_blank">
                  <FaGithub className="h-5 w-5" />
                </Link>
              </Button>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button disabled className="cursor-not-allowed">
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Available Dec 19</p>
                </TooltipContent>
              </Tooltip>
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
                </Link>
              </div>
            </motion.div>
          )}
          </AnimatePresence>
        </div>
      </nav>
    </TooltipProvider>
  );
}
