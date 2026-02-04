import type { Metadata } from "next";
import { AuthGuard } from "@/components/admin/auth-guard";
import { Sidebar } from "@/components/admin/sidebar";

export const metadata: Metadata = {
  title: "Admin - Retrace Feedback",
  robots: "noindex, nofollow",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-[hsl(var(--background))]">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </AuthGuard>
  );
}
