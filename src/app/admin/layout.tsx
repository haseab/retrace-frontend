import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin - Retrace Feedback",
  robots: "noindex, nofollow",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // This will be nested inside the root layout, but the page will
  // visually override the navbar/footer with its own full-screen styling
  return <>{children}</>;
}
