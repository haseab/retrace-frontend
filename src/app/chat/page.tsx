import { SectionHeader } from "@/components/ui/section-header";
import { CrispChat } from "@/components/crisp-chat";
import { supportInfo } from "@/lib/faq-data";
import Link from "next/link";
import { MessageSquare, Mail } from "lucide-react";

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
            <SectionHeader
              title="Need Help?"
              subtitle="I'm here to help. Chat with me live or send an email."
              centered
            />

            {/* Main Contact Options */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Live Chat */}
              <div className="rounded-xl border border-border bg-card p-8 space-y-4">
                <div className="flex items-center gap-3">
                  <MessageSquare className="h-6 w-6 text-primary" />
                  <h2 className="text-2xl font-bold">Live Chat</h2>
                </div>
                <p className="text-muted-foreground">
                  Click the chat bubble in the bottom right corner. Usually respond in 1-2 minutes (unless I'm asleep lol).
                </p>
              </div>

              {/* Email */}
              <div className="rounded-xl border border-border bg-card p-8 space-y-4">
                <div className="flex items-center gap-3">
                  <Mail className="h-6 w-6 text-primary" />
                  <h2 className="text-2xl font-bold">Email</h2>
                </div>
                <p className="text-muted-foreground mb-3">
                  For detailed questions or bug reports. I'll get back to you within 24 hours.
                </p>
                <a
                  href={`mailto:${supportInfo.email}`}
                  className="text-primary hover:underline font-medium"
                >
                  {supportInfo.email}
                </a>
              </div>
            </div>

            {/* FAQ Link */}
            <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 p-6 text-center">
              <p className="text-muted-foreground mb-2">
                Got a quick question? Check the{" "}
                <Link href="/faq" className="text-blue-500 hover:text-blue-400 hover:underline font-medium">
                  FAQ
                </Link>
                {" "}first.
              </p>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
