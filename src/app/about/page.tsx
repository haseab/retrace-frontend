"use client";

import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/ui/section-header";
import { motion } from "framer-motion";
import { Github } from "lucide-react";
import Link from "next/link";
import Script from "next/script";
import { useEffect } from "react";

export default function AboutPage() {
  useEffect(() => {
    // Load Twitter widgets script
    if (typeof window !== "undefined" && (window as any).twttr) {
      (window as any).twttr.widgets.load();
    }
  }, []);

  return (
    <>
      <Script
        src="https://platform.twitter.com/widgets.js"
        strategy="lazyOnload"
      />
      <div className="pt-24 pb-20">
        {/* Hero */}
        <section className="px-4 sm:px-6 lg:px-8 py-12">
          <div className="mx-auto max-w-4xl text-center space-y-8">
            <SectionHeader title="About Retrace" centered />
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
              className="space-y-6"
            >
              <h2 className="text-3xl font-bold">The Story</h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                This project came about when Rewind announced that they'll be
                shutting down on December 19.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed">
                I was left without a solution myself. I use Rewind for a very
                particular purpose, which makes me use it 50x a day. I have been
                tracking every minute of my life using Toggl for the last 7.5
                years, and Rewind helps me identify exactly when I context
                switched, so that I could track it.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed">
                I even created a Raycast extension that allowed you to enter in
                natural language at what point in your rewind history you want
                to go to, and it would open it up at precisely that point in
                time. (e.g. 15 minutes ago, or sep 1 2:33pm) it even got 120
                installs too!
              </p>

              {/* Raycast Extension Image */}
              <div className="my-8 rounded-lg border border-border bg-card overflow-hidden">
                <img
                  src="https://pub-7712ec77fabb4a6d996c607b226d98f0.r2.dev/raycast-extension.jpg"
                  alt="Go to Rewind Timestamp Raycast Extension with 120 installs"
                  className="w-full h-auto"
                />
              </div>

              <p className="text-lg text-muted-foreground leading-relaxed">
                When I found out about the Limitless acquisition, I spent a
                couple of hours on the Limitless Slack channel of all of the
                disgruntled users, users who had really believed in the product
                and felt rug pulled. I spent a few days and I tried all of the
                alternatives: Screenpipe, Timescroll, Screenmemory. I created a
                Notion document with a table of all of the features I liked
                about Rewind and how the other stacked up against them.
              </p>

              {/* Comparison Table Image */}
              <div className="my-8 rounded-lg border border-border bg-card overflow-hidden">
                <img
                  src="https://pub-7712ec77fabb4a6d996c607b226d98f0.r2.dev/rewind-alternatives.jpg"
                  alt="Main Rewind Features comparison table showing feature parity across different alternatives"
                  className="w-full h-auto"
                />
              </div>

              <p className="text-lg text-muted-foreground leading-relaxed">
                In the end I was left disappointed, and I realized that all open
                source solutions of products just simply{" "}
                <strong>AREN'T GOOD</strong>. And I didn't like that that was
                the case. I put out this tweet:
              </p>

              {/* First Tweet Embed */}
              <div className="my-8 flex justify-center">
                <blockquote className="twitter-tweet" data-theme="dark">
                  <p lang="en" dir="ltr">
                    I don&#39;t see enough consumer software out there that is
                    both open source and extremely high quality.
                    <br />
                    <br />
                    Where is that for Notion?
                    <br />
                    Where is that for Google Calendar?
                    <br />
                    Where is that for Todoist?
                    <br />
                    Where is that for Rewind?
                    <br />
                    Where is that for Email?
                  </p>
                  &mdash; haseab (@haseab_){" "}
                  <a href="https://twitter.com/haseab_/status/1998401911217942805?ref_src=twsrc%5Etfw">
                    December 9, 2025
                  </a>
                </blockquote>
              </div>

              <p className="text-lg text-muted-foreground leading-relaxed">
                So I thought why don't I just build my own version of Rewind to
                use personally? I spent a couple of days mulling over it,
                looking more deeply into how Rewind was even built, as well as
                the other open source alternatives, assessing whether I could
                even build something like this. Because I've never coded in
                Swift before, I've never built a desktop application, I've just
                built web apps.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed">
                I saw this tweet soon after:
              </p>

              {/* Second Tweet Embed */}
              <div className="my-8 flex justify-center">
                <blockquote className="twitter-tweet" data-theme="dark">
                  <p lang="en" dir="ltr">
                    only make promises you can keep.{" "}
                    <a href="https://t.co/3FVzttSQlB">
                      https://t.co/3FVzttSQlB
                    </a>
                  </p>
                  &mdash; ben (is hiring engineers) (@benhylak){" "}
                  <a href="https://twitter.com/benhylak/status/1999147125419147440?ref_src=twsrc%5Etfw">
                    December 11, 2025
                  </a>
                </blockquote>
              </div>

              <p className="text-lg text-muted-foreground leading-relaxed">
                And thought back to the people grieving in the community Slack.
                All of the people who didn't have a solution, who weren't even
                technical enough to build it out.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed">
                I thought about what I said before about open source consumer
                software not being high quality enough.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed">
                And I thought:{" "}
                <strong>
                  fuck it, I'm going to build a better version of Rewind. And
                  it's going to be free and open source.
                </strong>
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed">
                And I had about 1 week before Rewind AI shutdown. The clock
                starts.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed">
                I learned everything I could about Swift in a few hours, about
                building a desktop application over a web app, about best
                practices, etc. Luckily, I already did some thinking on the
                architecture a few days earlier, so my focus this next week was
                on execution.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed">
                I was hyperfocused on concurrency. I had 3 Claude Code sessions
                open at the same time. My goal was to launch with feature parity
                with Rewind by December 19th.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed">
                I did not take an hour off, simply because I couldn't afford to;
                this was a BIG project. Rewind apparently spent 2 years
                developing the product with multiple engineers before releasing
                it. I had to compress that into 6 days. Luckily I had AI.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed">
                I had to make snap decisions. What will the name be? I thought
                of Glint, Trace, Refind, Rerun, Retrace. To find a compatible
                domain name took an hour to ideate and get. The logo? 15
                minutes. Creating & launching the website? 3 hours.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed">
                There were a couple of things that I actually did not like about
                Rewind/Limitless. One big one was not really prioritizing the
                privacy of others that coincide with their products. And so I
                wanted to make that a hard constraint for Retrace. This means
                blurring faces during meetings, not recording system audio but
                only recording mic audio during meetings, auto-redacting
                Personally Identifiable Information (PII), etc.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed">
                A happy accident: Rewind encrypts the SQLite database by
                default, but didn't encrypt the raw screenshot files. Which was
                great for us because I could help everyone migrate their Rewind
                screenshots over and rebuild the database! (although not
                perfectly)
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed">
                I present to you: <strong>Retrace ✨</strong>
              </p>
            </motion.div>
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
            <h2 className="text-3xl font-bold text-center">
              Team & Contributors
            </h2>
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
                  href="mailto:support@retrace.to"
                  className="p-4 rounded-lg border border-border hover:border-primary transition-colors"
                >
                  <h3 className="font-semibold mb-2">Report Bugs</h3>
                  <p className="text-sm text-muted-foreground">Email Support</p>
                </a>
                <a
                  href="https://retrace.featurebase.app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-4 rounded-lg border border-border hover:border-primary transition-colors"
                >
                  <h3 className="font-semibold mb-2">Community</h3>
                  <p className="text-sm text-muted-foreground">Featurebase</p>
                </a>
                <a
                  href="https://twitter.com/retrace"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-4 rounded-lg border border-border hover:border-primary transition-colors"
                >
                  <h3 className="font-semibold mb-2">Follow Updates</h3>
                  <p className="text-sm text-muted-foreground">Twitter/X</p>
                </a>
              </div>
            </motion.div>
          </div>
        </section>
      </div>
    </>
  );
}
