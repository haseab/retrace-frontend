import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/sections/navbar";
import { Footer } from "@/components/sections/footer";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Retrace - Your Screen History, Searchable & Private",
  description:
    "Local-first screen recording and search for macOS. All data stays on your Mac, encrypted and private. Open source alternative to Rewind AI.",
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
    title: "Retrace - Your Screen History, Searchable & Private",
    description:
      "Local-first screen recording and search for macOS. All data stays on your Mac, encrypted and private.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Retrace - Your Screen History, Searchable & Private",
    description:
      "Local-first screen recording and search for macOS. All data stays on your Mac, encrypted and private.",
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
        <Navbar />
        <main className="min-h-screen">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
