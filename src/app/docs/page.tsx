import Link from "next/link";
import { Book, Download, Search, Settings, Code, Github } from "lucide-react";
import { SectionHeader } from "@/components/ui/section-header";
import { Button } from "@/components/ui/button";

const docsSections = [
  {
    icon: Download,
    title: "Getting Started",
    description: "Installation and initial setup",
    topics: [
      "Installing Retrace",
      "First-time setup",
      "Granting permissions",
      "Basic configuration",
    ],
  },
  {
    icon: Search,
    title: "Using Retrace",
    description: "Search, browse, and manage your screen history",
    topics: [
      "Search syntax",
      "Keyboard shortcuts",
      "App exclusions",
      "Pausing recording",
    ],
  },
  {
    icon: Settings,
    title: "Configuration",
    description: "Settings and preferences",
    topics: [
      "Capture frequency",
      "Storage management",
      "Privacy settings",
      "Performance tuning",
    ],
  },
  {
    icon: Code,
    title: "Developer Guide",
    description: "Building and contributing to Retrace",
    topics: [
      "Architecture overview",
      "Building from source",
      "Contributing guidelines",
      "API reference",
    ],
  },
];

export const metadata = {
  title: "Documentation - Retrace",
  description: "Learn how to use Retrace and contribute to the project",
};

export default function DocsPage() {
  return (
    <div className="pt-24 pb-20">
      <section className="px-4 sm:px-6 lg:px-8 py-12">
        <div className="mx-auto max-w-5xl space-y-12">
          <SectionHeader
            title="Documentation"
            subtitle="Everything you need to know about using and contributing to Retrace"
            centered
          />

          {/* Quick Links */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button asChild variant="outline">
              <Link href="/download">
                <Download className="mr-2 h-4 w-4" />
                Installation Guide
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link
                href="https://github.com/haseab/retrace"
                target="_blank"
              >
                <Github className="mr-2 h-4 w-4" />
                View on GitHub
              </Link>
            </Button>
          </div>

          {/* Documentation Sections */}
          <div className="grid gap-8 md:grid-cols-2">
            {docsSections.map((section, index) => (
              <div
                key={section.title}
                className="rounded-lg border border-border bg-card p-8 space-y-4 hover:border-primary/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-primary/10 text-primary">
                    <section.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">{section.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {section.description}
                    </p>
                  </div>
                </div>
                <ul className="space-y-2">
                  {section.topics.map((topic) => (
                    <li
                      key={topic}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer flex items-center gap-2"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                      {topic}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Quick Start */}
          <div className="rounded-xl border border-border bg-muted/30 p-8 space-y-6">
            <div className="flex items-center gap-2">
              <Book className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold">Quick Start</h2>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-3">1. Install Retrace</h3>
                <div className="bg-card p-4 rounded-lg border border-border">
                  <code className="text-sm font-mono">
                    brew install --cask retrace
                  </code>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Or download the .dmg from the{" "}
                  <Link href="/download" className="text-primary hover:underline">
                    download page
                  </Link>
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">
                  2. Grant Permissions
                </h3>
                <p className="text-sm text-muted-foreground">
                  Open Retrace and grant Screen Recording and Accessibility
                  permissions in System Settings when prompted.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">3. Start Recording</h3>
                <p className="text-sm text-muted-foreground">
                  Retrace will automatically start capturing your screen. You can
                  pause/resume from the menu bar icon.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">
                  4. Search Your History
                </h3>
                <p className="text-sm text-muted-foreground">
                  Use natural language queries to search. Try "email from John" or
                  "YouTube video about cooking".
                </p>
              </div>
            </div>
          </div>

          {/* Developer Resources */}
          <div className="rounded-xl border border-border bg-card p-8 space-y-6">
            <h2 className="text-2xl font-bold">Developer Resources</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <a
                href="https://github.com/haseab/retrace"
                target="_blank"
                rel="noopener noreferrer"
                className="p-4 rounded-lg border border-border hover:border-primary transition-colors"
              >
                <h3 className="font-semibold mb-2">GitHub Repository</h3>
                <p className="text-sm text-muted-foreground">
                  View source code, report issues, and contribute
                </p>
              </a>
              <a
                href="https://github.com/haseab/retrace/blob/main/CONTRIBUTING.md"
                target="_blank"
                rel="noopener noreferrer"
                className="p-4 rounded-lg border border-border hover:border-primary transition-colors"
              >
                <h3 className="font-semibold mb-2">Contributing Guide</h3>
                <p className="text-sm text-muted-foreground">
                  Learn how to contribute to Retrace
                </p>
              </a>
              <a
                href="https://github.com/haseab/retrace/blob/main/ARCHITECTURE.md"
                target="_blank"
                rel="noopener noreferrer"
                className="p-4 rounded-lg border border-border hover:border-primary transition-colors"
              >
                <h3 className="font-semibold mb-2">Architecture</h3>
                <p className="text-sm text-muted-foreground">
                  Understand how Retrace works internally
                </p>
              </a>
              <a
                href="https://github.com/haseab/retrace/blob/main/BUILD.md"
                target="_blank"
                rel="noopener noreferrer"
                className="p-4 rounded-lg border border-border hover:border-primary transition-colors"
              >
                <h3 className="font-semibold mb-2">Build Instructions</h3>
                <p className="text-sm text-muted-foreground">
                  Compile Retrace from source code
                </p>
              </a>
            </div>
          </div>

          {/* Help & Support */}
          <div className="rounded-xl border border-border bg-card p-8 text-center space-y-4">
            <h2 className="text-2xl font-bold">Need Help?</h2>
            <p className="text-muted-foreground">
              Check the FAQ or join our community for support
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button asChild variant="outline">
                <Link href="/faq">View FAQ</Link>
              </Button>
              <Button asChild variant="outline">
                <Link
                  href="https://github.com/haseab/retrace/discussions"
                  target="_blank"
                >
                  Community Discussions
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
