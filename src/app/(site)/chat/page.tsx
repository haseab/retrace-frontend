import { CopyEmailButton } from "@/components/copy-email-button";
import { CrispChat } from "@/components/crisp-chat";
import { DiscordCard } from "@/components/discord-card";
import { OpenCrispChatButton } from "@/components/open-crisp-chat-button";
import { SectionHeader } from "@/components/ui/section-header";
import { supportInfo } from "@/lib/faq-data";
import Link from "next/link";
import { BiLogoGmail } from "react-icons/bi";

const liveChatCardClassName =
  "relative h-full overflow-hidden rounded-xl border border-[#0b336c]/65 bg-gradient-to-br from-[#0b336c]/28 via-card to-card p-8";

const emailCardClassName =
  "relative h-full overflow-hidden rounded-xl border border-[#0b336c]/65 bg-gradient-to-br from-[#0b336c]/28 via-card to-card p-8";

const faqCalloutClassName =
  "relative overflow-hidden rounded-2xl border border-[#0b336c]/55 bg-gradient-to-br from-[#0b336c]/26 via-card to-card p-6 sm:p-7";

export const metadata = {
  title: "Support - Retrace",
  description: "Get help with Retrace. Live chat or email support.",
};

export default function ChatPage() {
  return (
    <>
      <CrispChat />
      <div className="pt-24 pb-20">
        <section className="px-4 sm:px-6 lg:px-8 py-12">
          <div className="mx-auto max-w-3xl space-y-8">
            <SectionHeader title="Need Help?" subtitle="" centered />

            {/* FAQ Link */}
            <div className={faqCalloutClassName}>
              <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[#0b336c]/40 blur-2xl" />
              <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-[0.2em] text-[#6ba4e5]">
                    Start Here
                  </p>
                  <p className="text-lg font-semibold leading-snug sm:text-xl">
                    Got a quick question? Check the FAQ first.
                  </p>
                </div>
                <Link
                  href="/faq"
                  className="inline-flex w-fit items-center rounded-full border border-[#0b336c]/70 bg-[#0b336c]/45 px-4 py-2 text-sm font-semibold text-[#d9ecff] transition-colors hover:bg-[#114388]"
                >
                  Open FAQ
                </Link>
              </div>
            </div>

            {/* Main Contact Options */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Email */}
              <div className={emailCardClassName}>
                <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-[#0b336c]/45 blur-2xl" />
                <div className="relative flex h-full flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-[#0b336c]/35 p-2 ring-1 ring-[#0b336c]/70">
                      <BiLogoGmail className="h-5 w-5 text-[#6ba4e5]" />
                    </div>
                    <h2 className="text-2xl font-bold">Email</h2>
                  </div>
                  <p className="text-muted-foreground">
                    For detailed bug reports. I&apos;ll get back to you within
                    2-3 days.
                  </p>
                  <CopyEmailButton
                    email={supportInfo.email}
                    className="mt-auto inline-flex h-11 w-full items-center justify-center gap-2 rounded-full border border-border/70 bg-background/70 px-4 text-sm font-semibold text-foreground transition-colors hover:border-[#0b336c]/65 hover:bg-[#0b336c]/20"
                  />
                </div>
              </div>

              <DiscordCard />

              {/* Live Chat */}
              <div className={liveChatCardClassName}>
                <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-[#0b336c]/45 blur-2xl" />
                <div className="relative flex h-full flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-[#0b336c]/35 p-2 ring-1 ring-[#0b336c]/70">
                      <CrispIcon className="h-5 w-5 text-[#6ba4e5]" />
                    </div>
                    <h2 className="text-2xl font-bold">Live Chat</h2>
                  </div>
                  <p className="text-muted-foreground">
                    Usually respond in 1-2 minutes (unless I&apos;m asleep lol).
                  </p>
                  <OpenCrispChatButton
                    openLabel="Launch Live Chat"
                    closeLabel="Close Live Chat"
                    className="mt-auto inline-flex h-11 w-full items-center justify-center rounded-full border border-border/70 bg-transparent px-4 text-sm font-semibold text-white transition-colors hover:border-[#0b336c]/70 hover:bg-[#0b336c]/20"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

function CrispIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6.8 4h10.4A3.8 3.8 0 0 1 21 7.8v6.4a3.8 3.8 0 0 1-3.8 3.8h-4.7l-3.6 2.8c-.8.6-1.9 0-1.9-1V18a3.8 3.8 0 0 1-3-3.8V7.8A3.8 3.8 0 0 1 6.8 4Z" />
      <circle cx="9.4" cy="10.6" r="1" fill="currentColor" stroke="none" />
      <circle cx="14.6" cy="10.6" r="1" fill="currentColor" stroke="none" />
      <path d="M8.8 13.6a4.8 4.8 0 0 0 6.4 0" />
    </svg>
  );
}
