import { SectionHeader } from "@/components/ui/section-header";
import { Database, Eye, Lock, Mic, MonitorX } from "lucide-react";

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
            subtitle="Last updated: December 2025"
            centered
          />

          <div className="prose prose-lg max-w-none dark:prose-invert">
            {/* Product Philosophy */}
            <section className="mt-12 space-y-4">
              <h2 className="text-3xl font-bold">Product Philosophy</h2>
              <p>
                Retrace is a "Rewind AI" alternative that focuses on{" "}
                <strong>extreme privacy</strong> for both yourself and others.
                Other apps record everything indiscriminately, Retrace is
                designed with privacy-first architecture that:
              </p>
              <ul className="space-y-2">
                <li>✅ Minimizes data collection by default</li>
                <li>✅ Protects the privacy of others in your recordings</li>
                <li>
                  ✅ Strictly limits audio recording to your microphone only
                </li>
                <li>
                  ✅ Gives you complete control over what is captured and stored
                </li>
                <li>✅ Ensures all processing happens on your device</li>
              </ul>
            </section>

            {/* Zero-Knowledge Local-First Architecture */}
            <section className="mt-12 space-y-4">
              <h2 className="text-3xl font-bold flex items-center gap-2">
                <Lock className="h-7 w-7 text-primary" />
                Zero-Knowledge Local-First Architecture
              </h2>
              <p className="text-muted-foreground font-semibold">
                This is a non-negotiable technical guarantee:
              </p>
              <p>
                <strong>All data is stored locally on your device.</strong>{" "}
                There are no "Retrace Servers" listening to you. Period.
              </p>
              <ul className="space-y-2">
                <li>
                  <strong>Audio recordings:</strong> Stored locally as encrypted
                  files
                </li>
                <li>
                  <strong>Screen captures:</strong> Stored locally in encrypted
                  format
                </li>
                <li>
                  <strong>Transcripts:</strong> Stored in local SQLite database
                </li>
                <li>
                  <strong>Vector embeddings:</strong> Computed and stored
                  locally for semantic search
                </li>
                <li>
                  <strong>OCR text:</strong> Extracted and stored locally
                </li>
              </ul>
              <p className="bg-muted p-4 rounded-lg text-sm">
                <strong>Zero data is uploaded to the cloud.</strong> All AI
                processing (OCR, transcription, embeddings) happens on-device
                using Apple's Neural Engine or local models. External API calls
                only occur with explicit user approval.
              </p>
            </section>

            {/* Restricted Audio Capture */}
            <section className="mt-12 space-y-4">
              <h2 className="text-3xl font-bold flex items-center gap-2">
                <Mic className="h-7 w-7 text-primary" />
                Restricted Audio Capture ("Mic-Only" Clause)
              </h2>
              <p className="font-semibold text-lg">
                Retrace protects the privacy of others in your conversations.
              </p>
              <div className="bg-primary/10 border-2 border-primary/20 p-6 rounded-lg space-y-3">
                <h3 className="text-xl font-semibold">What We Record:</h3>
                <p>
                  ✅ <strong>Your microphone input only</strong> (your voice)
                </p>
                <h3 className="text-xl font-semibold mt-4">
                  What We DON'T Record:
                </h3>
                <p>
                  ❌ <strong>System audio</strong> ("What You Hear" - other
                  people's voices in calls)
                </p>
                <p className="text-sm">
                  Retrace does not tap into system audio or record the other
                  side of your calls. This ensures the privacy of people you
                  communicate with is protected.
                </p>
              </div>

              <div className="space-y-4 mt-6">
                <h3 className="text-xl font-semibold">
                  Context-Triggered Recording
                </h3>
                <p>
                  Audio recording is <strong>NOT active 24/7</strong>. It only
                  activates when:
                </p>
                <ul className="space-y-2">
                  <li>
                    • Specific meeting software is detected (Zoom, Google Meet,
                    FaceTime, etc.)
                  </li>
                  <li>• You manually toggle recording on</li>
                </ul>
                <div className="bg-muted p-4 rounded-lg">
                  <p className="font-semibold">Automatic Fail-Safe:</p>
                  <p className="text-sm">
                    Recording automatically disables after{" "}
                    <strong>5 minutes</strong> of no meeting software detection,
                    preventing accidental continuous recording.
                  </p>
                </div>
              </div>
            </section>

            {/* Restricted Visual Capture */}
            <section className="mt-12 space-y-4">
              <h2 className="text-3xl font-bold flex items-center gap-2">
                <MonitorX className="h-7 w-7 text-primary" />
                Restricted Visual Capture & PII Protection
              </h2>
              <p>
                Retrace captures screenshots for memory recall, but with
                built-in privacy safeguards:
              </p>

              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-semibold">PII Filtering</h3>
                  <p>
                    The app automatically attempts to detect and redact
                    sensitive information:
                  </p>
                  <ul className="space-y-2">
                    <li>
                      • <strong>Password fields:</strong> Automatically detected
                      and redacted
                    </li>
                    <li>
                      • <strong>Face detection:</strong> On-device vision
                      frameworks blur faces to protect identity
                    </li>
                    <li>
                      • <strong>Credit card numbers:</strong> Pattern detection
                      and redaction
                    </li>
                    <li>
                      • <strong>SSN/Tax IDs:</strong> Automatically masked when
                      detected
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold">
                    Application Exclusion List
                  </h3>
                  <p>
                    You can blacklist specific applications that will{" "}
                    <strong>never</strong> be recorded:
                  </p>
                  <ul className="space-y-2">
                    <li>
                      🏦 Banking applications (Chase, Bank of America, etc.)
                    </li>
                    <li>
                      🕵️ Private browsing windows (Incognito, Private mode)
                    </li>
                    <li>💬 Encrypted messaging (Signal, Telegram, WhatsApp)</li>
                    <li>⚙️ Custom apps you specify</li>
                  </ul>
                  <p className="text-sm bg-muted p-4 rounded-lg mt-2">
                    These apps are strictly excluded <strong>before</strong> any
                    screenshot is taken. The data never exists in the first
                    place.
                  </p>
                </div>
              </div>
            </section>

            {/* Biometric Disclaimer */}
            <section className="mt-12 space-y-4">
              <h2 className="text-3xl font-bold">Biometric Data Disclaimer</h2>
              <div className="bg-yellow-500/10 border-2 border-yellow-500/20 p-6 rounded-lg">
                <p className="font-semibold text-lg mb-2">
                  We DO NOT Store Biometric Identifiers
                </p>
                <p>
                  Any face detection performed by Retrace is used{" "}
                  <strong>
                    solely for the purpose of blurring/anonymization of others
                    you record
                  </strong>
                  , not identification. We explicitly do not:
                </p>
                <ul className="space-y-2 mt-3">
                  <li>❌ Store face geometry or facial recognition models</li>
                  <li>❌ Create biometric fingerprints or identifiers</li>
                  <li>❌ Build face databases for identification</li>
                  <li>❌ Share facial data with third parties</li>
                </ul>
                <p className="text-sm mt-3">
                  Face detection happens transiently in memory using Apple's
                  Vision framework, only to apply blurring. No biometric data is
                  persisted.
                </p>
              </div>
            </section>

            {/* What Retrace Stores Locally */}
            <section className="mt-12 space-y-4">
              <h2 className="text-3xl font-bold flex items-center gap-2">
                <Database className="h-7 w-7 text-primary" />
                What Retrace Stores Locally
              </h2>
              <p className="text-muted-foreground">
                All of the following data is stored exclusively on your Mac:
              </p>
              <ul className="space-y-2">
                <li>
                  <strong>Audio files:</strong> Your microphone recordings (only
                  during meetings), encrypted
                </li>
                <li>
                  <strong>Screen captures:</strong> Images of your screen
                  activity, stored in encrypted format
                </li>
                <li>
                  <strong>Transcripts:</strong> Audio-to-text transcriptions,
                  stored in local SQLite database
                </li>
                <li>
                  <strong>Extracted text:</strong> OCR results from screen
                  captures
                </li>
                <li>
                  <strong>Vector embeddings:</strong> AI-generated embeddings
                  for semantic search, computed locally
                </li>
                <li>
                  <strong>Search queries:</strong> Your search history (only
                  stored locally)
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

            {/* Nuclear Option - Hard Delete */}
            <section className="mt-12 space-y-4">
              <h2 className="text-3xl font-bold">
                Data Deletion ("Nuclear Option")
              </h2>
              <div className="bg-red-500/10 border-2 border-red-500/20 p-6 rounded-lg space-y-3">
                <p className="font-semibold text-lg">
                  Hard Delete Means Hard Delete
                </p>
                <p>
                  When you delete a recording or time segment in Retrace, it is{" "}
                  <strong>irreversibly wiped</strong> from your device. This
                  includes:
                </p>
                <ul className="space-y-2">
                  <li>🗑️ The audio file (securely overwritten)</li>
                  <li>🗑️ The transcript text (deleted from SQLite)</li>
                  <li>
                    🗑️ The vector embedding (removed from vector database)
                  </li>
                  <li>🗑️ Associated screenshots and metadata</li>
                </ul>
                <p className="text-sm font-semibold mt-3">
                  No "ghost data" is retained. Once deleted, the data cannot be
                  recovered—not by you, not by us, not by anyone. This is by
                  design.
                </p>
              </div>

              <div className="space-y-4 mt-6">
                <h3 className="text-xl font-semibold">
                  Granular Deletion Controls
                </h3>
                <p>You can delete:</p>
                <ul className="space-y-2">
                  <li>• Individual recordings or screenshots</li>
                  <li>
                    • Entire date ranges (e.g., "delete everything from last
                    week")
                  </li>
                  <li>
                    • Specific time windows (e.g., "delete 2PM - 3PM on
                    Tuesday")
                  </li>
                  <li>
                    • Nuclear option: Wipe all Retrace data with one click
                  </li>
                </ul>
              </div>
            </section>

            {/* What We DON'T Collect */}
            <section className="mt-12 space-y-4">
              <h2 className="text-3xl font-bold flex items-center gap-2">
                <Eye className="h-7 w-7 text-primary" />
                What We DON'T Collect
              </h2>
              <ul className="space-y-2">
                <li>❌ No cloud uploads of your screen captures or audio</li>
                <li>❌ No system audio or other people's voices</li>
                <li>❌ No biometric identifiers or face geometry</li>
                <li>❌ No telemetry or analytics from the application</li>
                <li>❌ No account creation or authentication</li>
                <li>❌ No tracking pixels or third-party scripts</li>
                <li>❌ No crash reports (unless you manually share logs)</li>
                <li>❌ No usage statistics</li>
                <li>❌ No IP addresses or device identifiers</li>
              </ul>
            </section>

            {/* Encryption */}
            <section className="mt-12 space-y-4">
              <h2 className="text-3xl font-bold">Encryption at Rest</h2>
              <p>
                Your local database (SQLite/Vector DB) and audio files are
                encrypted using:
              </p>
              <ul className="space-y-2">
                <li>• macOS native encryption (FileVault)</li>
                <li>• App-specific encryption for sensitive files</li>
                <li>• Encryption keys managed by macOS Keychain</li>
              </ul>
            </section>

            {/* On-Device AI */}
            <section className="mt-12 space-y-4">
              <h2 className="text-3xl font-bold">On-Device AI Processing</h2>
              <p>
                <strong>All AI processing happens on your device.</strong> No
                data leaves your Mac.
              </p>
              <ul className="space-y-2">
                <li>
                  • <strong>Audio transcription:</strong> Apple's Speech
                  Recognition framework
                </li>
                <li>
                  • <strong>OCR:</strong> Apple Vision framework
                </li>
                <li>
                  • <strong>Semantic search:</strong> Local vector embeddings
                </li>
                <li>
                  • <strong>Face detection (for blurring):</strong> Apple Vision
                  framework
                </li>
              </ul>
              <div className="bg-muted p-4 rounded-lg space-y-2 mt-4">
                <p className="font-semibold">
                  External API Usage (Opt-In Only):
                </p>
                <p className="text-sm">
                  If an external API (like OpenAI) is ever used, it is{" "}
                  <strong>only with your explicit, opt-in consent</strong> for a
                  specific query. In such cases:
                </p>
                <ul className="space-y-1 ml-4 text-sm">
                  <li>• Data is anonymized before transmission</li>
                  <li>
                    • Only the specific query text is sent, never audio or
                    screenshots
                  </li>
                  <li>
                    • You will be clearly notified before any external API call
                  </li>
                  <li>• This feature is disabled by default</li>
                </ul>
              </div>
            </section>
            {/* Website Analytics */}
            <section className="mt-12 space-y-4">
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
            </section>

            {/* Open Source Verification */}
            <section className="mt-12 space-y-4">
              <h2 className="text-3xl font-bold flex items-center gap-2">
                <Lock className="h-7 w-7 text-primary" />
                Open Source Verification
              </h2>
              <p>Don't just take our word for it. Verify our privacy claims:</p>
              <ul className="space-y-2">
                <li>
                  <strong>Audit the code:</strong> Full source code available on{" "}
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
                  <strong>GPL v3 License:</strong> Ensures the code remains open
                  and auditable forever
                </li>
              </ul>
            </section>

            {/* Data Portability & Deletion */}
            <section className="mt-12 space-y-4">
              <h2 className="text-3xl font-bold">Data Portability & Export</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-semibold">Export Your Data</h3>
                  <p>
                    All your data is already accessible in standard formats:
                  </p>
                  <ul className="space-y-2">
                    <li>
                      Audio files: Standard audio formats in{" "}
                      <code>~/Library/Application Support/Retrace/audio/</code>
                    </li>
                    <li>
                      Screen captures: PNG/JPEG files in{" "}
                      <code>
                        ~/Library/Application Support/Retrace/captures/
                      </code>
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
                      Delete <code>~/Library/Application Support/Retrace/</code>
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

            {/* Changes to This Policy */}
            <section className="mt-12 space-y-4">
              <h2 className="text-3xl font-bold">Changes to This Policy</h2>
              <p>
                If we make any changes to this privacy policy, we will update
                this page and the "Last updated" date. Given our local-first
                architecture, we don't anticipate major changes.
              </p>
              <p className="font-semibold">
                Any changes that would weaken these privacy guarantees will
                require explicit user consent and a new major version release.
              </p>
            </section>

            {/* Contact */}
            <section className="mt-12 space-y-4">
              <h2 className="text-3xl font-bold">Contact</h2>
              <p>
                If you have questions about this privacy policy or Retrace's
                data handling:
              </p>
              <ul className="space-y-2">
                <li>
                  Email{" "}
                  <a
                    href="mailto:support@retrace.to"
                    className="text-primary hover:underline"
                  >
                    support@retrace.to
                  </a>
                </li>
                <li>
                  Join our community on{" "}
                  <a
                    href="https://retrace.featurebase.app"
                    className="text-primary hover:underline"
                  >
                    Featurebase
                  </a>
                </li>
              </ul>
            </section>

            {/* Final Note */}
            <div className="mt-12 rounded-xl border border-border bg-card p-8 not-prose">
              <p className="text-lg font-semibold text-center">
                Privacy isn't a feature. It's a fundamental right.
              </p>
              <p className="text-center text-muted-foreground mt-2">
                That's why we built Retrace to be local-first from day
                one—protecting both your privacy and the privacy of those around
                you.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
