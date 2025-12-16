import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { SectionHeader } from "@/components/ui/section-header";

export const metadata = {
  title: "FAQ - Retrace",
  description: "Frequently asked questions about Retrace",
};

const faqCategories = [
  {
    category: "General",
    questions: [
      {
        q: "What is Retrace?",
        a: "Retrace is a local-first screen recording and search application for macOS. It continuously captures your screen, extracts text using OCR, and lets you search through your entire screen history using natural language queries. Unlike cloud-based alternatives, all data stays encrypted on your Mac.",
      },
      {
        q: "How is it different from Rewind AI?",
        a: "Retrace is 100% open source and local-first. While Rewind stores data in the cloud, Retrace keeps everything on your Mac. You can audit the code, verify no data leaves your device, and have complete control over your screen history. Plus, it's free and licensed under GPL v3.",
      },
      {
        q: "Is it really free and open source?",
        a: "Yes! Retrace is licensed under GPL v3, which means the source code is publicly available, you can modify it, and it will always remain free. You can view the code on GitHub and even build it yourself from source.",
      },
      {
        q: "What features are available in Release #1 (December 19th)?",
        a: "Release #1 includes: Rewind data migration, database decryption, timeline scrolling, continuous screen recording, basic search (no highlighting yet), keyboard shortcuts, frame deletion, and non-optimized file storage/power use. Audio recording is NOT yet available in Release #1.",
      },
      {
        q: "What's coming in Release #2 (estimated January 1st)?",
        a: "Release #2 will add: Audio recording (with privacy controls for mic & system audio), optimized power use & file storage, search highlighting, deep linking to timestamps, customizability options (language support, retention windows), daily recap, metadata filtering, ability to copy text from search, privacy protections (PII filtering, face blurring), and permission checking.",
      },
    ],
  },
  {
    category: "Privacy & Security",
    questions: [
      {
        q: "Where is my data stored?",
        a: "All data is stored locally on your Mac in ~/Library/Application Support/Retrace/. Screen captures are saved as encrypted image files, and extracted text is stored in a local SQLite database. Nothing is ever uploaded to any server.",
      },
      {
        q: "Is my data encrypted?",
        a: "Yes. All screen captures and extracted text are encrypted at rest using your Mac's built-in keychain. The encryption keys are managed by macOS and never leave your device.",
      },
      {
        q: "Can anyone else access my screen history?",
        a: "No. Since all data is stored locally on your Mac and encrypted with your device's keychain, only you (with your Mac login credentials) can access your screen history.",
      },
      {
        q: "Do you send data to any servers?",
        a: "Absolutely not. Retrace has no backend servers. All processing happens on your device. You can verify this by monitoring your network traffic or reviewing the source code on GitHub.",
      },
      {
        q: "How do I verify no data leaves my device?",
        a: "You can use network monitoring tools like Little Snitch or Wireshark to verify Retrace makes no network connections. You can also audit the source code on GitHub or build the app yourself from source.",
      },
    ],
  },
  {
    category: "Technical",
    questions: [
      {
        q: "What are the system requirements?",
        a: "Minimum: macOS 13.0 (Ventura), 4GB RAM, 2GB free disk space. Strongly Recommended: Apple Silicon Mac (M1 or later), 8GB+ RAM, 10GB+ free disk space for history storage.",
      },
      {
        q: "How much disk space does it use?",
        a: "Release #1 uses non-optimized file storage. On average, expect 1-2GB per week of continuous recording. Release #2 (estimated January 1st) will include optimized file storage that significantly reduces disk usage. You can configure capture frequency and automatic deletion of old captures in settings.",
      },
      {
        q: "Does it slow down my Mac?",
        a: "Retrace is optimized for efficiency, especially on Apple Silicon. Screen capture and OCR processing happen in the background with low priority to minimize impact on system performance.",
      },
      {
        q: "How much battery does it consume?",
        a: "Release #1 uses non-optimized power consumption. On Apple Silicon Macs, expect moderate battery impact. Release #2 (estimated January 1st) will include power optimizations to minimize battery drain. Intel Macs may see higher battery consumption during OCR processing.",
      },
      {
        q: "Can I use it on Intel Macs?",
        a: "Retrace has only been tested on Apple Silicon Macs and cannot guarantee that it will work on Intel Macs. All operations are optimized for Apple Silicon.",
      },
      {
        q: "Does it work with multiple monitors?",
        a: "Yes! Retrace captures all connected displays. You can configure which monitors to record in the settings.",
      },
    ],
  },
  {
    category: "Usage",
    questions: [
      {
        q: "How do I search my history?",
        a: "Use natural language queries in the search bar. For example, 'email from John about project' or 'YouTube video about cooking'. Retrace uses both OCR text and fuzzy matching to find relevant results. Note: Search result highlighting is estimated for January 1st release.",
      },
      {
        q: "Can I exclude certain apps from recording?",
        a: "Yes. You can configure app exclusions in Settings > Privacy. For example, you might want to exclude password managers, banking apps, or private browsing windows. Note: Enhanced privacy protection features (PII filtering, face blurring) are estimated for January 1st release.",
      },
      {
        q: "How do I pause recording?",
        a: "Click the Retrace menu bar icon and select 'Pause Recording'. You can also set up keyboard shortcuts in Settings.",
      },
      {
        q: "Can I import data from Rewind or other apps?",
        a: "Yes! Retrace supports one-click migration of your Rewind data. This feature is available in Release #1 (December 19th).",
      },
      {
        q: "How far back does the history go?",
        a: "This depends on your storage settings. By default, Retrace keeps 30 days of history. You can configure retention windows in Settings (estimated for January 1st release) to keep more or less history based on your available disk space.",
      },
      {
        q: "Does Retrace record audio?",
        a: "Audio recording (microphone and system audio) is not available in Release #1 (December 19th). It will be added in Release #2 (estimated January 1st) with strict privacy controls - microphone can run 24/7 (captures only your voice), while system audio is automatically muted during meetings to protect others' privacy.",
      },
    ],
  },
  {
    category: "Troubleshooting",
    questions: [
      {
        q: "Screen recording permission not working",
        a: "Go to System Settings > Privacy & Security > Screen Recording and ensure Retrace is checked. You may need to restart the app after granting permission. If issues persist, try removing and re-adding the permission.",
      },
      {
        q: "Search returns no results",
        a: "This usually means OCR processing is still in progress for recent captures. Wait a few minutes and try again. You can check indexing progress in Settings > Database. Also verify that recording is not paused.",
      },
      {
        q: "High CPU/memory usage",
        a: "OCR processing can be CPU-intensive, especially on Intel Macs. You can reduce the capture frequency in Settings to decrease resource usage. However on Apple Silicon, this should rarely be an issue.",
      },
      {
        q: "How to completely uninstall",
        a: "1) Quit Retrace, 2) Delete /Applications/Retrace.app, 3) Delete ~/Library/Application Support/Retrace/, 4) Delete ~/Library/Preferences/com.retrace.app.plist (optional). All data will be permanently removed.",
      },
    ],
  },
  {
    category: "Development",
    questions: [
      {
        q: "How can I contribute?",
        a: "Check out our GitHub repository! We welcome pull requests for bug fixes, new features, documentation improvements, and translations. Read CONTRIBUTING.md for guidelines.",
      },
      {
        q: "Where do I report bugs?",
        a: "Please email support@retrace.to with detailed steps to reproduce the bug, your macOS version, and Retrace version. Logs from Settings > Advanced > Export Logs are helpful too.",
      },
      {
        q: "Can I request features?",
        a: "Absolutely! Submit a feature request on Featurebase at retrace.featurebase.app. Describe your use case and why it would benefit other users. Popular requests are more likely to be implemented.",
      },
      {
        q: "How do I build from source?",
        a: "Clone the repository, install dependencies with the package manager, and run the build script. Detailed build instructions are in BUILD.md in the GitHub repository.",
      },
    ],
  },
];

export default function FAQPage() {
  return (
    <div className="pt-24 pb-20">
      <section className="px-4 sm:px-6 lg:px-8 py-12">
        <div className="mx-auto max-w-4xl space-y-12">
          <SectionHeader
            title="Frequently Asked Questions"
            subtitle="Find answers to common questions about Retrace"
            centered
          />

          <div className="space-y-12">
            {faqCategories.map((category) => (
              <div key={category.category} className="space-y-6">
                <h2 className="text-2xl font-bold text-primary">
                  {category.category}
                </h2>
                <Accordion type="single" collapsible className="w-full">
                  {category.questions.map((item, index) => (
                    <AccordionItem
                      key={index}
                      value={`${category.category}-${index}`}
                    >
                      <AccordionTrigger className="text-left">
                        {item.q}
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground">
                        {item.a}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-border bg-card p-8 text-center space-y-4">
            <h2 className="text-2xl font-bold">Still have questions?</h2>
            <p className="text-muted-foreground">
              Join our community on Featurebase or email support
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="https://retrace.featurebase.app"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Visit Featurebase →
              </a>
              <a
                href="mailto:support@retrace.to"
                className="text-primary hover:underline"
              >
                Email Support →
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
