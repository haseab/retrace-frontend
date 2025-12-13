import { Shield, Lock, Eye, Database } from "lucide-react";
import { SectionHeader } from "@/components/ui/section-header";

export const metadata = {
  title: "Privacy Policy - Retrace",
  description:
    "Retrace privacy policy. We collect ZERO personal data. Everything stays on your Mac.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen pt-24 pb-20">
      <section className="px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl space-y-16">
          <SectionHeader
            title="Privacy Policy"
            subtitle="Last updated: December 2024"
            centered
          />

          <div className="prose prose-lg max-w-none dark:prose-invert">
            {/* TL;DR */}
            <div className="rounded-xl border-2 border-primary/20 bg-primary/5 p-8 not-prose">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <Shield className="h-6 w-6 text-primary" />
                TL;DR
              </h2>
              <p className="text-lg leading-relaxed">
                <strong>We collect ZERO personal data.</strong> Retrace is a
                local-first application. All your screen captures, extracted
                text, and search history stay on your Mac, encrypted with your
                device's keychain. We don't have servers to collect your data
                even if we wanted to.
              </p>
            </div>

            {/* What Retrace Stores Locally */}
            <section className="space-y-4">
              <h2 className="text-3xl font-bold flex items-center gap-2">
                <Database className="h-7 w-7 text-primary" />
                What Retrace Stores Locally
              </h2>
              <p className="text-muted-foreground">
                All of the following data is stored exclusively on your Mac:
              </p>
              <ul className="space-y-2">
                <li>
                  <strong>Screen captures:</strong> Images of your screen
                  activity, stored in an encrypted format
                </li>
                <li>
                  <strong>Extracted text:</strong> OCR results from screen
                  captures, stored in a local SQLite database
                </li>
                <li>
                  <strong>Search queries:</strong> Your search history (only
                  stored locally for convenience)
                </li>
                <li>
                  <strong>User preferences:</strong> App settings and
                  configurations
                </li>
                <li>
                  <strong>Encryption keys:</strong> Managed securely by macOS
                  Keychain
                </li>
              </ul>
              <p className="text-sm text-muted-foreground bg-muted p-4 rounded-lg">
                <strong>Location:</strong> All data is stored in{" "}
                <code>~/Library/Application Support/Retrace/</code> and can be
                deleted at any time.
              </p>
            </section>

            {/* What We DON'T Collect */}
            <section className="space-y-4">
              <h2 className="text-3xl font-bold flex items-center gap-2">
                <Eye className="h-7 w-7 text-primary" />
                What We DON'T Collect
              </h2>
              <ul className="space-y-2">
                <li>❌ No cloud uploads of your screen captures</li>
                <li>❌ No telemetry or analytics from the application</li>
                <li>❌ No account creation or authentication</li>
                <li>❌ No tracking pixels or third-party scripts</li>
                <li>❌ No crash reports (unless you manually share logs)</li>
                <li>❌ No usage statistics</li>
                <li>❌ No IP addresses or device identifiers</li>
              </ul>
            </section>

            {/* Website Analytics */}
            <section className="space-y-4">
              <h2 className="text-3xl font-bold">Website Analytics</h2>
              <p>
                This website uses privacy-respecting analytics to understand how
                many people visit our site. We use{" "}
                <strong>anonymous download counters</strong> that track:
              </p>
              <ul className="space-y-2">
                <li>Number of downloads (no personal information)</li>
                <li>Download source (website, Homebrew, GitHub)</li>
                <li>Platform version (Intel vs Apple Silicon)</li>
              </ul>
              <p>
                <strong>We do NOT use:</strong>
              </p>
              <ul className="space-y-2">
                <li>❌ Google Analytics</li>
                <li>❌ Facebook Pixel</li>
                <li>❌ Session recording tools</li>
                <li>❌ Advertising trackers</li>
                <li>❌ Cookies for tracking</li>
              </ul>
            </section>

            {/* Open Source Verification */}
            <section className="space-y-4">
              <h2 className="text-3xl font-bold flex items-center gap-2">
                <Lock className="h-7 w-7 text-primary" />
                Open Source Verification
              </h2>
              <p>Don't just take our word for it. Verify our privacy claims:</p>
              <ul className="space-y-2">
                <li>
                  <strong>Audit the code:</strong> Full source code available
                  on{" "}
                  <a
                    href="https://github.com/haseab/retrace"
                    className="text-primary hover:underline"
                  >
                    GitHub
                  </a>
                </li>
                <li>
                  <strong>Build from source:</strong> Compile the app yourself
                  to ensure no hidden tracking
                </li>
                <li>
                  <strong>Network monitoring:</strong> Use tools like Little
                  Snitch to verify no data leaves your Mac
                </li>
                <li>
                  <strong>GPL v3 License:</strong> Ensures the code remains
                  open and auditable forever
                </li>
              </ul>
            </section>

            {/* Data Portability & Deletion */}
            <section className="space-y-4">
              <h2 className="text-3xl font-bold">
                Data Portability & Deletion
              </h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-semibold">Export Your Data</h3>
                  <p>
                    All your data is already accessible in standard formats:
                  </p>
                  <ul className="space-y-2">
                    <li>
                      Screen captures: PNG/JPEG files in{" "}
                      <code>~/Library/Application Support/Retrace/captures/</code>
                    </li>
                    <li>
                      Database: SQLite file that can be opened with any SQLite
                      viewer
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold">
                    Delete All Your Data
                  </h3>
                  <p>To completely remove all Retrace data:</p>
                  <ol className="space-y-2">
                    <li>Quit Retrace application</li>
                    <li>
                      Delete{" "}
                      <code>~/Library/Application Support/Retrace/</code>
                    </li>
                    <li>
                      Delete <code>/Applications/Retrace.app</code>
                    </li>
                  </ol>
                  <p className="text-sm text-muted-foreground bg-muted p-4 rounded-lg mt-4">
                    No data remains on any server because we don't have any
                    servers storing your data.
                  </p>
                </div>
              </div>
            </section>

            {/* Third-Party Services */}
            <section className="space-y-4">
              <h2 className="text-3xl font-bold">Third-Party Services</h2>
              <p>
                Retrace does not integrate with any third-party services that
                could compromise your privacy. The application runs entirely
                offline after installation.
              </p>
            </section>

            {/* Changes to This Policy */}
            <section className="space-y-4">
              <h2 className="text-3xl font-bold">Changes to This Policy</h2>
              <p>
                If we make any changes to this privacy policy, we will update
                this page and the "Last updated" date. Given our local-first
                architecture, we don't anticipate major changes.
              </p>
            </section>

            {/* Contact */}
            <section className="space-y-4">
              <h2 className="text-3xl font-bold">Contact</h2>
              <p>
                If you have questions about this privacy policy or Retrace's
                data handling:
              </p>
              <ul className="space-y-2">
                <li>
                  Open an issue on{" "}
                  <a
                    href="https://github.com/haseab/retrace/issues"
                    className="text-primary hover:underline"
                  >
                    GitHub
                  </a>
                </li>
                <li>
                  Join our community discussion on{" "}
                  <a
                    href="https://github.com/haseab/retrace/discussions"
                    className="text-primary hover:underline"
                  >
                    GitHub Discussions
                  </a>
                </li>
              </ul>
            </section>

            {/* Final Note */}
            <div className="rounded-xl border border-border bg-card p-8 not-prose">
              <p className="text-lg font-semibold text-center">
                Privacy isn't a feature. It's a fundamental right.
              </p>
              <p className="text-center text-muted-foreground mt-2">
                That's why we built Retrace to be local-first from day one.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
