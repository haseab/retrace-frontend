"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "./auth-guard";
import { useApiToken } from "./bearer-token-guard";

const RETRACE_LOGO_URL = "https://retrace.featurebase.app/_next/image?url=https%3A%2F%2F693d07fcb1cff86b762551dd.featurebase-attachments.com%2Fc%2Fstatic%2F019b1668-d610-70b7-a7cf-ecb5fb57c2f2%2Fk9zm0pb6w7.png&w=96&q=75";

const navItems = [
  { href: "/internal/feedback", label: "Feedback", icon: MessageSquareIcon },
  { href: "/internal/analytics", label: "Analytics", icon: BarChartIcon },
];

interface SidebarProps {
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
}

export function Sidebar({ collapsed: controlledCollapsed, onCollapsedChange }: SidebarProps) {
  const pathname = usePathname();
  const { logout } = useAuth();
  const { clearBearerToken, hasBearerToken } = useApiToken();
  const [internalCollapsed, setInternalCollapsed] = useState(false);

  // Use controlled or internal state
  const collapsed = controlledCollapsed ?? internalCollapsed;
  const setCollapsed = onCollapsedChange ?? setInternalCollapsed;

  // Load collapsed state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("sidebar_collapsed");
    if (saved === "true") {
      setCollapsed(true);
    }
  }, []);

  const toggleCollapsed = () => {
    const newValue = !collapsed;
    setCollapsed(newValue);
    localStorage.setItem("sidebar_collapsed", String(newValue));
  };

  const handleClearBearerToken = () => {
    clearBearerToken();
  };

  return (
    <aside
      className={`bg-[hsl(var(--card))] border-r border-[hsl(var(--border))] min-h-screen flex flex-col transition-all duration-300 ${
        collapsed ? "w-16" : "w-64"
      }`}
    >
      <div className={`p-4 border-b border-[hsl(var(--border))] flex items-center ${collapsed ? "justify-center" : "justify-between"}`}>
        <Link href="/internal" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg overflow-hidden bg-[hsl(var(--primary))] flex items-center justify-center flex-shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={RETRACE_LOGO_URL}
              alt="Retrace logo"
              className="w-full h-full object-cover"
            />
          </div>
          {!collapsed && <span className="font-semibold text-lg">Retrace</span>}
        </Link>
        {!collapsed && (
          <button
            onClick={toggleCollapsed}
            className="p-1.5 rounded-lg hover:bg-[hsl(var(--secondary))] transition-colors"
            title="Collapse sidebar"
          >
            <ChevronLeftIcon className="w-4 h-4" />
          </button>
        )}
      </div>

      {collapsed && (
        <div className="p-2 border-b border-[hsl(var(--border))]">
          <button
            onClick={toggleCollapsed}
            className="w-full p-2 rounded-lg hover:bg-[hsl(var(--secondary))] transition-colors flex items-center justify-center"
            title="Expand sidebar"
          >
            <ChevronRightIcon className="w-4 h-4" />
          </button>
        </div>
      )}

      <nav className="flex-1 p-2">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors ${
                    collapsed ? "justify-center" : ""
                  } ${
                    isActive
                      ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]"
                      : "text-[hsl(var(--muted-foreground))] hover:text-white hover:bg-[hsl(var(--secondary))]"
                  }`}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {!collapsed && item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-2 border-t border-[hsl(var(--border))]">
        {hasBearerToken && (
          <button
            onClick={handleClearBearerToken}
            className={`mb-1.5 flex items-center gap-3 w-full px-3 py-3 rounded-lg text-sm font-medium text-[hsl(var(--muted-foreground))] hover:text-white hover:bg-[hsl(var(--secondary))] transition-colors ${
              collapsed ? "justify-center" : ""
            }`}
            title={collapsed ? "Clear Token" : undefined}
          >
            <KeyIcon className="w-5 h-5 flex-shrink-0" />
            {!collapsed && "Clear Token"}
          </button>
        )}

        <button
          onClick={logout}
          className={`flex items-center gap-3 w-full px-3 py-3 rounded-lg text-sm font-medium text-[hsl(var(--muted-foreground))] hover:text-white hover:bg-[hsl(var(--secondary))] transition-colors ${
            collapsed ? "justify-center" : ""
          }`}
          title={collapsed ? "Logout" : undefined}
        >
          <LogOutIcon className="w-5 h-5 flex-shrink-0" />
          {!collapsed && "Logout"}
        </button>
      </div>
    </aside>
  );
}

// Simple SVG icons
function MessageSquareIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function BarChartIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="12" y1="20" x2="12" y2="10" />
      <line x1="18" y1="20" x2="18" y2="4" />
      <line x1="6" y1="20" x2="6" y2="16" />
    </svg>
  );
}

function LogOutIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

function ChevronLeftIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

function KeyIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="7.5" cy="15.5" r="5.5" />
      <path d="M21 2l-9.6 9.6" />
      <path d="M15.5 7.5l1.5 1.5" />
      <path d="M18.5 4.5l1.5 1.5" />
    </svg>
  );
}
