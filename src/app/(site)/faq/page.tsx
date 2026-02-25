import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { SectionHeader } from "@/components/ui/section-header";
import { faqCategories, supportInfo } from "@/lib/faq-data";
import Script from "next/script";

export const metadata = {
  title: "FAQ - Retrace",
  description: "Frequently asked questions about Retrace",
};

export default function FAQPage() {
  const automaticChatEmbedAttributes = {
    open: "true",
    openDelay: "5000",
  } as const;

  return (
    <>
      <Script
        async
        id="cmm23474100qtbew41yvy8m4y"
        src="https://automatic.chat/embed.js"
        strategy="afterInteractive"
        {...(automaticChatEmbedAttributes as any)}
      />
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
                  href={supportInfo.featurebase}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Visit Featurebase →
                </a>
                <a
                  href={`mailto:${supportInfo.email}`}
                  className="text-primary hover:underline"
                >
                  Email Support →
                </a>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
