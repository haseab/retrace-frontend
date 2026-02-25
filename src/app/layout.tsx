import type { Metadata } from "next";
import Script from "next/script";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Retrace - Your Screen History, Searchable & Local",
  description:
    "Local-first screen recording and search for macOS. All data stays on your Mac, private. Open source alternative to Rewind AI.",
  keywords: [
    "screen recording",
    "macOS",
    "local-first",
    "privacy",
    "open source",
    "searchable screen history",
    "Rewind alternative",
  ],
  authors: [{ name: "Retrace Team" }],
  openGraph: {
    title: "Retrace - Your Screen History, Searchable & Local",
    description:
      "Local-first screen recording and search for macOS. All data stays on your Mac, private.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Retrace - Your Screen History, Searchable & Local",
    description:
      "Local-first screen recording and search for macOS. All data stays on your Mac, private.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={cn(inter.className, "antialiased")}>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-QXRJRMRWTW"
          strategy="afterInteractive"
        />
        <Script id="ga4-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-QXRJRMRWTW');
          `}
        </Script>
        {children}
      </body>
    </html>
  );
}
