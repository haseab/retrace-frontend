"use client";

import { motion } from "framer-motion";
import { Heart, Github, Users, Code } from "lucide-react";
import { SectionHeader } from "@/components/ui/section-header";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const values = [
  {
    icon: Heart,
    title: "Privacy First",
    description:
      "We believe privacy is a fundamental right, not a luxury feature. That's why everything in Retrace stays on your device.",
  },
  {
    icon: Code,
    title: "Open Source",
    description:
      "Transparency builds trust. Our GPL v3 license ensures Retrace remains free and auditable forever.",
  },
  {
    icon: Users,
    title: "Community Driven",
    description:
      "Built by the community, for the community. Every contribution makes Retrace better for everyone.",
  },
];

export default function AboutPage() {
  return (
    <div className="pt-24 pb-20">
      {/* Hero */}
      <section className="px-4 sm:px-6 lg:px-8 py-12">
        <div className="mx-auto max-w-4xl text-center space-y-8">
          <SectionHeader
            title="About Retrace"
            subtitle="Building the future of privacy-first productivity tools"
            centered
          />
        </div>
      </section>

      {/* Mission */}
      <section className="px-4 sm:px-6 lg:px-8 py-12 bg-muted/30">
        <div className="mx-auto max-w-4xl space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="prose prose-lg max-w-none dark:prose-invert"
          >
            <h2 className="text-3xl font-bold">Our Mission</h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              We're building Retrace to prove that powerful productivity tools
              don't require sacrificing your privacy. In a world where most
              software companies collect, analyze, and monetize your data, we're
              taking a different path.
            </p>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Retrace is completely local-first. Your screen captures, search
              history, and personal data never leave your Mac. We don't have
              servers to store your data because we fundamentally believe your
              digital life should belong to you and you alone.
            </p>
          </motion.div>
        </div>
      </section>

      {/* The Story */}
      <section className="px-4 sm:px-6 lg:px-8 py-12">
        <div className="mx-auto max-w-4xl space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="prose prose-lg max-w-none dark:prose-invert"
          >
            <h2 className="text-3xl font-bold">The Story</h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Retrace was inspired by Rewind AI and similar tools that promise
              to make your digital life searchable. These tools are incredibly
              useful, but they come with a significant privacy cost: uploading
              your entire screen history to the cloud.
            </p>
            <p className="text-lg text-muted-foreground leading-relaxed">
              We asked ourselves: Why should screen recording require cloud
              servers? Modern Macs, especially those with Apple Silicon, are
              more than powerful enough to handle OCR, indexing, and search
              locally. The answer was clear: it shouldn't.
            </p>
            <p className="text-lg text-muted-foreground leading-relaxed">
              So we built Retrace as a completely open-source, local-first
              alternative. It's free, it's auditable, and it respects your
              privacy because your data never leaves your device.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Values */}
      <section className="px-4 sm:px-6 lg:px-8 py-12 bg-muted/30">
        <div className="mx-auto max-w-4xl space-y-12">
          <h2 className="text-3xl font-bold text-center">Our Values</h2>
          <div className="grid gap-8 md:grid-cols-3">
            {values.map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="space-y-4 text-center"
              >
                <div className="flex justify-center">
                  <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 text-primary">
                    <value.icon className="h-8 w-8" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold">{value.title}</h3>
                <p className="text-muted-foreground">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Open Source */}
      <section className="px-4 sm:px-6 lg:px-8 py-12">
        <div className="mx-auto max-w-4xl space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            <h2 className="text-3xl font-bold">Open Source Commitment</h2>
            <div className="prose prose-lg max-w-none dark:prose-invert">
              <p className="text-lg text-muted-foreground leading-relaxed">
                Retrace is licensed under GPL v3, one of the strongest
                copyleft licenses. This ensures:
              </p>
              <ul className="space-y-2 text-muted-foreground">
                <li>The source code will always be publicly available</li>
                <li>
                  Anyone can audit the code to verify our privacy claims
                </li>
                <li>
                  You're free to modify and distribute your own versions
                </li>
                <li>
                  Any derivative works must also be open source under GPL v3
                </li>
                <li>The project can never be "taken private"</li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button size="lg" asChild>
                <Link
                  href="https://github.com/haseab/retrace"
                  target="_blank"
                >
                  <Github className="mr-2 h-5 w-5" />
                  View on GitHub
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link
                  href="https://github.com/haseab/retrace/blob/main/CONTRIBUTING.md"
                  target="_blank"
                >
                  Contribute
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Team */}
      <section className="px-4 sm:px-6 lg:px-8 py-12 bg-muted/30">
        <div className="mx-auto max-w-4xl space-y-8">
          <h2 className="text-3xl font-bold text-center">Team & Contributors</h2>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center space-y-6"
          >
            <p className="text-lg text-muted-foreground leading-relaxed">
              Retrace is maintained by a community of privacy advocates,
              developers, and users who believe in local-first software. We
              welcome contributors of all skill levels.
            </p>
            <div className="rounded-xl border border-border bg-card p-8">
              <h3 className="text-xl font-semibold mb-4">Want to Join?</h3>
              <p className="text-muted-foreground mb-6">
                We're always looking for contributors to help with development,
                documentation, design, and community support.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="https://github.com/haseab/retrace/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22"
                  target="_blank"
                  className="text-primary hover:underline"
                >
                  Good First Issues →
                </Link>
                <Link
                  href="https://github.com/haseab/retrace/discussions"
                  target="_blank"
                  className="text-primary hover:underline"
                >
                  Join Discussions →
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Contact */}
      <section className="px-4 sm:px-6 lg:px-8 py-12">
        <div className="mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="rounded-xl border border-border bg-card p-8 text-center space-y-6"
          >
            <h2 className="text-3xl font-bold">Get in Touch</h2>
            <p className="text-lg text-muted-foreground">
              Questions, feedback, or just want to say hi?
            </p>
            <div className="grid gap-4 md:grid-cols-3">
              <a
                href="https://github.com/haseab/retrace/issues"
                target="_blank"
                rel="noopener noreferrer"
                className="p-4 rounded-lg border border-border hover:border-primary transition-colors"
              >
                <h3 className="font-semibold mb-2">Report Bugs</h3>
                <p className="text-sm text-muted-foreground">
                  GitHub Issues
                </p>
              </a>
              <a
                href="https://github.com/haseab/retrace/discussions"
                target="_blank"
                rel="noopener noreferrer"
                className="p-4 rounded-lg border border-border hover:border-primary transition-colors"
              >
                <h3 className="font-semibold mb-2">Community</h3>
                <p className="text-sm text-muted-foreground">
                  GitHub Discussions
                </p>
              </a>
              <a
                href="https://twitter.com/retrace"
                target="_blank"
                rel="noopener noreferrer"
                className="p-4 rounded-lg border border-border hover:border-primary transition-colors"
              >
                <h3 className="font-semibold mb-2">Follow Updates</h3>
                <p className="text-sm text-muted-foreground">
                  Twitter/X
                </p>
              </a>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
