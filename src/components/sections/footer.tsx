import Link from "next/link";
import Image from "next/image";
import { Github, Twitter } from "lucide-react";

const footerLinks = {
  product: [
    { name: "Features", href: "/#features" },
    { name: "Download", href: "/download" },
    { name: "Roadmap", href: "/roadmap" },
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
            <p className="text-sm text-muted-foreground mb-4">
              Your screen history, searchable and private. Everything stays on your Mac.
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
            <h3 className="text-sm font-semibold mb-4">Product</h3>
            <ul className="space-y-3">
              {footerLinks.product.map((link) => (
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

          <div>
            <h3 className="text-sm font-semibold mb-4">Resources</h3>
            <ul className="space-y-3">
              {footerLinks.resources.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    target={link.href.startsWith("http") ? "_blank" : undefined}
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-4">Company</h3>
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

        <div className="mt-12 border-t border-border pt-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Retrace. Open source under GPL v3.
            </p>
            <p className="text-sm text-muted-foreground">
              Local-first. Privacy-first. Always.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
