import { SectionHeader } from "@/components/ui/section-header";
import { AlertCircle, CheckCircle, FileText } from "lucide-react";

export const metadata = {
  title: "Terms of Service - Retrace",
  description:
    "Retrace terms of service. Free and open source software under GPL v3 license.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen pt-24 pb-20">
      <section className="px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl space-y-16">
          <SectionHeader
            title="Terms of Service"
            subtitle="Last updated: December 2025"
            centered
          />

          <div className="prose prose-lg max-w-none dark:prose-invert">
            {/* Acceptance of Terms */}
            <section className="mt-12 space-y-4">
              <h2 className="text-3xl font-bold flex items-center gap-2">
                <FileText className="h-7 w-7 text-primary" />
                Acceptance of Terms
              </h2>
              <p className="text-muted-foreground">
                By downloading, installing, or using Retrace, you agree to be
                bound by these Terms of Service. If you do not agree to these
                terms, do not use the software.
              </p>
            </section>

            {/* License */}
            <section className="mt-12 space-y-4">
              <h2 className="text-3xl font-bold">Open Source License</h2>
              <p>
                Retrace is licensed under the{" "}
                <strong>GNU General Public License v3.0 (GPL v3)</strong>. This
                means:
              </p>
              <ul className="space-y-2">
                <li>
                  ✅ You can use Retrace for any purpose, including commercial
                  use
                </li>
                <li>✅ You can modify the source code to suit your needs</li>
                <li>✅ You can distribute copies of Retrace</li>
                <li>
                  ✅ You can distribute modified versions, but they must also be
                  under GPL v3
                </li>
                <li>
                  ✅ The source code is publicly available on{" "}
                  <a
                    href="https://github.com/haseab/retrace"
                    className="text-primary hover:underline"
                  >
                    GitHub
                  </a>
                </li>
              </ul>
              <p className="text-sm text-muted-foreground bg-muted p-4 rounded-lg">
                <strong>Important:</strong> If you distribute Retrace or
                derivative works, you must make the source code available under
                the same GPL v3 license.
              </p>
            </section>

            {/* Use of the Software */}
            <section className="mt-12 space-y-4">
              <h2 className="text-3xl font-bold">Use of the Software</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-semibold flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    Permitted Uses
                  </h3>
                  <ul className="space-y-2">
                    <li>
                      Personal use for recording and searching your screen
                      history
                    </li>
                    <li>Commercial use in your business or organization</li>
                    <li>Educational and research purposes</li>
                    <li>
                      Modification and customization for your specific needs
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-destructive" />
                    Prohibited Uses
                  </h3>
                  <ul className="space-y-2">
                    <li>
                      ❌ Recording or capturing content that violates laws or
                      regulations
                    </li>
                    <li>
                      ❌ Using Retrace to infringe on others' privacy or
                      intellectual property
                    </li>
                    <li>
                      ❌ Distributing closed-source or proprietary versions
                      (violates GPL v3)
                    </li>
                    <li>
                      ❌ Removing or modifying license or copyright notices
                    </li>
                  </ul>
                </div>
              </div>
            </section>

            {/* No Warranty */}
            <section className="mt-12 space-y-4">
              <h2 className="text-3xl font-bold">No Warranty</h2>
              <p>
                Retrace is provided <strong>"AS IS"</strong> without warranty of
                any kind, either expressed or implied, including but not limited
                to:
              </p>
              <ul className="space-y-2">
                <li>Warranties of merchantability</li>
                <li>Fitness for a particular purpose</li>
                <li>Non-infringement</li>
                <li>Accuracy or completeness of data</li>
              </ul>
              <p className="text-sm text-muted-foreground bg-muted p-4 rounded-lg">
                <strong>Note:</strong> As open source software, there is no
                guarantee of support, updates, or bug fixes. However, we
                actively maintain the project and welcome community
                contributions.
              </p>
            </section>

            {/* Limitation of Liability */}
            <section className="mt-12 space-y-4">
              <h2 className="text-3xl font-bold">Limitation of Liability</h2>
              <p>
                In no event shall the developers, contributors, or copyright
                holders be liable for any claim, damages, or other liability,
                including:
              </p>
              <ul className="space-y-2">
                <li>Data loss or corruption</li>
                <li>System failures or crashes</li>
                <li>
                  Privacy breaches (though Retrace is designed to be local-first
                  and private)
                </li>
                <li>Business interruption or lost profits</li>
                <li>Any other direct, indirect, or consequential damages</li>
              </ul>
              <p>
                You use Retrace at your own risk. You are responsible for
                maintaining backups of your data.
              </p>
            </section>

            {/* Privacy & Data */}
            <section className="mt-12 space-y-4">
              <h2 className="text-3xl font-bold">Privacy & Data Handling</h2>
              <p>
                Retrace is a local-first application. All your data stays on
                your Mac. We do not:
              </p>
              <ul className="space-y-2">
                <li>❌ Collect or store your personal data</li>
                <li>❌ Upload your screen captures to any server</li>
                <li>❌ Track your usage or behavior</li>
                <li>❌ Require account creation or authentication</li>
              </ul>
              <p>
                For complete details, see our{" "}
                <a href="/privacy" className="text-primary hover:underline">
                  Privacy Policy
                </a>
                .
              </p>
            </section>

            {/* System Requirements */}
            <section className="mt-12 space-y-4">
              <h2 className="text-3xl font-bold">System Requirements</h2>
              <p>
                Retrace requires macOS 13.0 or later. For Apple Silicon Macs.
                You are responsible for ensuring your system meets these
                requirements.
              </p>
            </section>

            {/* Third-Party Components */}
            <section className="mt-12 space-y-4">
              <h2 className="text-3xl font-bold">Third-Party Components</h2>
              <p>
                Retrace uses various open source libraries and components. Each
                has its own license, which can be found in the source code
                repository. By using Retrace, you also agree to comply with
                these third-party licenses.
              </p>
            </section>

            {/* Updates and Changes */}
            <section className="mt-12 space-y-4">
              <h2 className="text-3xl font-bold">Updates and Changes</h2>
              <p>
                We may update Retrace and these Terms of Service from time to
                time. Continued use of the software after updates constitutes
                acceptance of the new terms.
              </p>
              <p>Updates are distributed through:</p>
              <ul className="space-y-2">
                <li>Direct downloads from our website</li>
                <li>Homebrew package manager</li>
                <li>GitHub releases</li>
              </ul>
            </section>

            {/* Termination */}
            <section className="mt-12 space-y-4">
              <h2 className="text-3xl font-bold">Termination</h2>
              <p>
                You may stop using Retrace at any time by uninstalling the
                application and deleting all associated data. Your rights under
                the GPL v3 license persist even after you stop using the
                software.
              </p>
            </section>

            {/* Governing Law */}
            <section className="mt-12 space-y-4">
              <h2 className="text-3xl font-bold">Governing Law</h2>
              <p>
                These terms are governed by the laws of your jurisdiction. As
                open source software, Retrace is available worldwide, and you
                are responsible for compliance with local laws.
              </p>
            </section>

            {/* Contact */}
            <section className="mt-12 space-y-4">
              <h2 className="text-3xl font-bold">Contact</h2>
              <p>
                For questions about these Terms of Service or the GPL v3
                license, email{" "}
                <a
                  href="mailto:support@retrace.to"
                  className="text-primary hover:underline"
                >
                  support@retrace.to
                </a>
              </p>
              <p className="mt-4">
                You can also view the full GPL v3 license{" "}
                <a
                  href="https://www.gnu.org/licenses/gpl-3.0.en.html"
                  className="text-primary hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  here
                </a>
                .
              </p>
            </section>
          </div>
        </div>
      </section>
    </div>
  );
}
