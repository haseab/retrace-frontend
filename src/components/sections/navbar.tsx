"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { Menu, X, Download } from "lucide-react";
import { FaGithub } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SITE_CONFIG } from "@/lib/config";

const navigation = [
  { name: "Features", href: "/#features" },
  { name: "Docs", href: "/docs" },
  { name: "FAQ", href: "/faq" },
  { name: "About", href: "/about" },
  { name: "Roadmap", href: "/roadmap" },
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
    <nav
      className={cn(
        "fixed top-0 z-50 w-full transition-all duration-300",
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
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>

          <div className="hidden md:flex md:items-center md:gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href={SITE_CONFIG.links.github} target="_blank">
                <FaGithub className="h-5 w-5" />
              </Link>
            </Button>
            <Button asChild>
              <Link href="/download">
                <Download className="mr-2 h-4 w-4" />
                Download
              </Link>
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

        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-border py-4 space-y-2">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="block px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground hover:bg-accent rounded-md"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
            <div className="px-4 pt-2 space-y-2">
              <Button variant="outline" className="w-full" asChild>
                <Link href={SITE_CONFIG.links.github} target="_blank">
                  <FaGithub className="mr-2 h-4 w-4" />
                  GitHub
                </Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
