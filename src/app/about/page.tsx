"use client";

import { SectionHeader } from "@/components/ui/section-header";
import { motion } from "framer-motion";
import { Github, Mail, MessageSquare } from "lucide-react";
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
                This project started 6 days before its launch.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Limitless announced that they got acquired by Meta. Everyone had
                1 extra year of Limitless.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed">
                I assumed that this privilege extended to Rewind users as well.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed">
                I was wrong.{" "}
              </p>

              <p className="text-lg text-muted-foreground leading-relaxed">
                I found out a few days later that Rewind was going to shut down
                in an alarming 14 days after their announcement!
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed">
                I personally consider myself one of Rewinds biggest power users,
                using it dozens of times a day to manually track my time. If I
                had to pay triple what I was paying for it, I likely would have.
                And so you could imagine how I felt when I saw the news.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed">
                I used the app so much, that I even created a Raycast extension
                that allowed you to enter in natural language at what point in
                your rewind history you want to go to, (e.g. 15 minutes ago, or
                sep 1 2:33pm) and it would open it up at precisely that point in
                time. It even got 120 other people using it too, which was
                pretty cool.
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
                Rewind had other power users like me, for different purposes,
                and you could see the reaction they had when you went on the
                Community Slack channel. People were LIVID. There were people
                who really believed in the product, who believed that the
                company had their best interests at heart. And they felt like
                they got the rug pulled out from under them.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Personally, I have the mindest of "it is what is, let's move on
                and let's explore what else exists out there." So I spent a few
                days exploring all of the alternatives: Screenpipe, Timescroll,
                Screenmemory. I created a Notion document with a table of all of
                the features I liked about Rewind and how the other stacked up
                against them.
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
                source and free solutions for Rewind just simply{" "}
                <strong>WEREN'T GOOD</strong>.
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
                I have this conviction personally that if I focus my mind on
                anything, I can achieve it. And if I haven't seen anyone
                building high quality consumer software that's free and open
                source, then I'll be the one to show that it could be done.
              </p>

              <p className="text-lg text-muted-foreground leading-relaxed">
                So I thought,{" "}
                <strong>
                  "you know what? fuck it. I've never programmed in swift
                  before, I've never built a desktop application. I've only
                  built web apps. Not only will I recreate Rewind with feature
                  parity in 6 days, but I'm going to also make it free and open
                  source."
                </strong>
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed">
                And so the clock started.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed">
                I learned everything I could about Swift in a few hours, about
                building a desktop application vs a web app, about best
                practices, etc. Luckily, I already did some thinking on the
                architecture a few days earlier, so my focus was just on
                executing.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed">
                I did not take an hour off, simply because I couldn't afford to;
                this was a BIG project. Rewind apparently spent 2 years
                developing the product with multiple engineers before releasing
                it. I had to compress that into 6 days. Luckily I had Claude
                Code.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed">
                I was hyperfocused on concurrency. I had 3 Claude Code sessions
                open at the same time. My goal was to launch with feature parity
                with Rewind by December 19th.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed">
                I had to make snap decisions. What will the name be? I thought
                of Glint, Trace, Refind, Rerun, Retrace. Now I have to find an
                available domain name. That took an hour to ideate and get. Then
                the logo. 15 minutes. Then creating & launching the website? 3
                hours.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed">
                While building, I found a happy accident: Rewind encrypts the
                SQLite database by default, but didn't encrypt the raw
                picture/video files. Which was great for us because I could help
                everyone migrate their Rewind screenshots over and rebuild the
                database! (although not perfectly)
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed">
                What I didn't like about Rewind / Limitless was that they didn't
                really prioritize the privacy of others that coincided with
                their products. People would get their voice recorded or their
                face captured without consent. And so I wanted to make that a
                hard constraint for Retrace. This means blurring faces during
                meetings, not recording system audio but only recording mic
                audio during meetings, auto-redacting any PII.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Currently, i'm making progress with building the product. This
                website is done, the backend is mostly stable, now what's the
                left is to create the UI.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Open Source
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
              <div className="prose prose-lg max-w-none dark:prose-invert space-y-2">
                <p className="text-muted-foreground leading-relaxed">
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
        </section> */}

        {/* Creator Profile */}
        <section className="px-4 sm:px-6 lg:px-8 py-12 bg-muted/30">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-3xl font-bold text-center mb-8">Built By</h2>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="flex justify-center rounded-xl border border-border bg-card p-8"
            >
              <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
                <div className="flex-shrink-0">
                  <img
                    src="https://github.com/haseab.png"
                    alt="haseab profile"
                    className="w-32 h-32 rounded-full border-2 border-primary"
                  />
                </div>
                <div className="flex-1 text-center md:text-left space-y-4 justify-center">
                  <div>
                    <h3 className="text-2xl font-bold">Haseab</h3>
                    <p className="text-muted-foreground">
                      Creator & Maintainer
                    </p>
                  </div>
                  <p className="text-lg text-muted-foreground leading-relaxed"></p>
                  <div className="flex gap-4 justify-center md:justify-start">
                    <a
                      href="https://twitter.com/haseab_"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-primary transition-colors"
                    >
                      <svg
                        className="w-6 h-6"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                      </svg>
                    </a>
                    <a
                      href="https://github.com/haseab"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-primary transition-colors"
                    >
                      <Github className="w-6 h-6" />
                    </a>
                  </div>
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
                  href="mailto:support@retrace.to"
                  className="p-6 rounded-lg border border-border hover:border-primary transition-colors group"
                >
                  <div className="flex flex-col items-center gap-3">
                    <div className="flex items-center justify-center h-12 w-12 rounded-full bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <Mail className="h-6 w-6" />
                    </div>
                    <h3 className="font-semibold">Report Bugs</h3>
                    <p className="text-sm text-muted-foreground">
                      Email Support
                    </p>
                  </div>
                </a>
                <a
                  href="https://retrace.featurebase.app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-6 rounded-lg border border-border hover:border-primary transition-colors group"
                >
                  <div className="flex flex-col items-center gap-3">
                    <div className="flex items-center justify-center h-12 w-12 rounded-full bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <MessageSquare className="h-6 w-6" />
                    </div>
                    <h3 className="font-semibold">Community</h3>
                    <p className="text-sm text-muted-foreground">Featurebase</p>
                  </div>
                </a>
                <a
                  href="https://twitter.com/haseab_"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-6 rounded-lg border border-border hover:border-primary transition-colors group"
                >
                  <div className="flex flex-col items-center gap-3">
                    <div className="flex items-center justify-center h-12 w-12 rounded-full bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <svg
                        className="h-6 w-6"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                      </svg>
                    </div>
                    <h3 className="font-semibold">Follow Updates</h3>
                    <p className="text-sm text-muted-foreground">Twitter/X</p>
                  </div>
                </a>
              </div>
            </motion.div>
          </div>
        </section>
      </div>
    </>
  );
}
