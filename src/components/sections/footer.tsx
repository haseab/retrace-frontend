"use client";

import { Github, Twitter } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const footerLinks = {
  product: [
    { name: "Features", href: "/#features" },
    { name: "Download", href: "/download" },
    { name: "Roadmap", href: "https://retrace.featurebase.app" },
    { name: "Changelog", href: "/changelog" },
  ],
  resources: [
    { name: "Documentation", href: "/docs" },
    { name: "FAQ", href: "/faq" },
    { name: "GitHub", href: "https://github.com/haseab/retrace/" },
  ],
  company: [
    { name: "About", href: "/about" },
    { name: "Privacy", href: "/privacy" },
    { name: "Terms", href: "/terms" },
  ],
};

export function Footer() {
  return (
    <TooltipProvider delayDuration={0}>
      <footer className="border-t border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <Image
                  src="/logo.svg"
                  alt="Retrace Logo"
                  width={32}
                  height={32}
                  className="h-8 w-8"
                />
                <span className="text-xl font-bold">Retrace</span>
              </div>
              <p className="text-sm text-muted-foreground mb-4 pr-6">
                Your Screen History, Searchable. Private. Free. Open Source.
              </p>
              <div className="flex gap-2">
                <Link
                  href="https://github.com/haseab/retrace/"
                  target="_blank"
                  className="rounded-md p-2 hover:bg-accent transition-colors"
                >
                  <Github className="h-5 w-5" />
                </Link>
                <Link
                  href="https://twitter.com/haseab_"
                  target="_blank"
                  className="rounded-md p-2 hover:bg-accent transition-colors"
                >
                  <Twitter className="h-5 w-5" />
                </Link>
              </div>
            </div>

            <div>
              <h3 className="text-base font-semibold mb-4">Product</h3>
              <ul className="space-y-3">
                {footerLinks.product.map((link) => (
                  <li key={link.name}>
                    {link.name === "Changelog" ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span
                            className="text-sm cursor-not-allowed"
                            style={{ color: "#6b7280" }}
                          >
                            {link.name}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Coming soon</p>
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <Link
                        href={link.href}
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                        target={
                          link.href.startsWith("http") ? "_blank" : undefined
                        }
                      >
                        {link.name}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-base font-semibold mb-4">Resources</h3>
              <ul className="space-y-3">
                {footerLinks.resources.map((link) => (
                  <li key={link.name}>
                    {link.name === "Documentation" ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span
                            className="text-sm cursor-not-allowed"
                            style={{ color: "#6b7280" }}
                          >
                            {link.name}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Coming soon</p>
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <Link
                        href={link.href}
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                        target={
                          link.href.startsWith("http") ? "_blank" : undefined
                        }
                      >
                        {link.name}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-base font-semibold mb-4">Company</h3>
              <ul className="space-y-3">
                {footerLinks.company.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="flex mt-12 border-t border-border pt-8 justify-center">
            <p className="text-sm text-muted-foreground mb-4">
              Made with ❤️ by{" "}
              <Link
                href="https://twitter.com/haseab_"
                target="_blank"
                className="text-blue-400 hover:text-blue-300 transition-colors"
              >
                haseab
              </Link>
            </p>
          </div>
        </div>
      </footer>
    </TooltipProvider>
  );
}
