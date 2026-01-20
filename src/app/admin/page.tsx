"use client";

import { useState, useEffect } from "react";

interface DatabaseStats {
  sessionCount: number;
  frameCount: number;
  segmentCount: number;
  databaseSizeMB: number;
}

interface FeedbackItem {
  id: number;
  type: string;
  email: string | null;
  description: string;
  appVersion: string;
  buildNumber: string;
  macOSVersion: string;
  deviceModel: string;
  totalDiskSpace: string;
  freeDiskSpace: string;
  databaseStats: DatabaseStats;
  recentErrors: string[];
  recentLogs: string[];
  hasScreenshot: boolean;
  createdAt: string;
}

interface FeedbackResponse {
  count: number;
  feedback: FeedbackItem[];
}

// SHA-256 hash of the password - generate with: echo -n "yourpassword" | shasum -a 256
const ADMIN_PASSWORD_HASH = "a68c0f407849dc00666288a70913c3ae03d2f2bea0bcc8f72cf9dec8fe646247"; // hash of "retrace2024"

// Simple SHA-256 hash function for client-side
async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState<FeedbackItem | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [expandedLogs, setExpandedLogs] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const hashedInput = await sha256(password);
    if (hashedInput === ADMIN_PASSWORD_HASH) {
      setIsAuthenticated(true);
      setError("");
      localStorage.setItem("admin_auth", "true");
    } else {
      setError("Incorrect password");
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem("admin_auth");
  };

  useEffect(() => {
    const auth = localStorage.getItem("admin_auth");
    if (auth === "true") {
      setIsAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchFeedback();
    }
  }, [isAuthenticated, filter]);

  const fetchFeedback = async () => {
    setLoading(true);
    try {
      const url = filter === "all"
        ? "/api/feedback"
        : `/api/feedback?type=${encodeURIComponent(filter)}`;
      const res = await fetch(url);
      const data: FeedbackResponse = await res.json();
      setFeedback(data.feedback || []);
    } catch (err) {
      console.error("Failed to fetch feedback:", err);
    } finally {
      setLoading(false);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "Bug Report":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      case "Feature Request":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "Question":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="bg-[hsl(var(--card))] rounded-xl p-8 border border-[hsl(var(--border))]">
            <h1 className="text-2xl font-bold text-center mb-6">Admin Access</h1>
            <form onSubmit={handleLogin}>
              <div className="mb-4">
                <label className="block text-sm text-[hsl(var(--muted-foreground))] mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-[hsl(var(--input))] border border-[hsl(var(--border))] rounded-lg focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
                  placeholder="Enter admin password"
                  autoFocus
                />
              </div>
              {error && (
                <p className="text-red-400 text-sm mb-4">{error}</p>
              )}
              <button
                type="submit"
                className="w-full py-3 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] rounded-lg font-medium hover:opacity-90 transition-opacity"
              >
                Login
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Feedback Dashboard</h1>
            <p className="text-[hsl(var(--muted-foreground))] mt-1">
              {feedback.length} total submissions
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={fetchFeedback}
              className="px-4 py-2 bg-[hsl(var(--secondary))] rounded-lg hover:opacity-80 transition-opacity"
            >
              Refresh
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-[hsl(var(--muted-foreground))] hover:text-white transition-colors"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6">
          {["all", "Bug Report", "Feature Request", "Question"].map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filter === type
                  ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]"
                  : "bg-[hsl(var(--secondary))] text-[hsl(var(--muted-foreground))] hover:text-white"
              }`}
            >
              {type === "all" ? "All" : type}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="text-center py-12 text-[hsl(var(--muted-foreground))]">
            Loading...
          </div>
        ) : feedback.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-[hsl(var(--muted-foreground))]">No feedback yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Feedback List */}
            <div className="space-y-3">
              {feedback.map((item) => (
                <div
                  key={item.id}
                  onClick={() => { setSelectedItem(item); setExpandedLogs(false); }}
                  className={`p-4 bg-[hsl(var(--card))] rounded-xl border cursor-pointer transition-all ${
                    selectedItem?.id === item.id
                      ? "border-[hsl(var(--primary))]"
                      : "border-[hsl(var(--border))] hover:border-[hsl(var(--muted-foreground))]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className={`px-2 py-0.5 text-xs font-medium rounded border ${getTypeColor(
                            item.type
                          )}`}
                        >
                          {item.type}
                        </span>
                        {item.hasScreenshot && (
                          <span className="px-2 py-0.5 text-xs bg-purple-500/20 text-purple-400 rounded border border-purple-500/30">
                            Screenshot
                          </span>
                        )}
                      </div>
                      <p className="text-sm line-clamp-2 mb-2">
                        {item.description}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-[hsl(var(--muted-foreground))]">
                        <span>v{item.appVersion}</span>
                        <span>macOS {item.macOSVersion}</span>
                        <span>{formatDate(item.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Detail Panel */}
            <div className="lg:sticky lg:top-8 h-fit">
              {selectedItem ? (
                <div className="bg-[hsl(var(--card))] rounded-xl border border-[hsl(var(--border))] p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <span
                      className={`px-3 py-1 text-sm font-medium rounded border ${getTypeColor(
                        selectedItem.type
                      )}`}
                    >
                      {selectedItem.type}
                    </span>
                    <span className="text-sm text-[hsl(var(--muted-foreground))]">
                      #{selectedItem.id}
                    </span>
                  </div>

                  <div className="mb-6">
                    <h3 className="text-sm font-medium text-[hsl(var(--muted-foreground))] mb-2">
                      Description
                    </h3>
                    <p className="text-sm whitespace-pre-wrap">
                      {selectedItem.description}
                    </p>
                  </div>

                  {selectedItem.email && (
                    <div className="mb-6">
                      <h3 className="text-sm font-medium text-[hsl(var(--muted-foreground))] mb-2">
                        Email
                      </h3>
                      <a
                        href={`mailto:${selectedItem.email}`}
                        className="text-sm text-[hsl(var(--primary))] hover:underline"
                      >
                        {selectedItem.email}
                      </a>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                      <h3 className="text-sm font-medium text-[hsl(var(--muted-foreground))] mb-2">
                        App Version
                      </h3>
                      <p className="text-sm">
                        {selectedItem.appVersion} ({selectedItem.buildNumber})
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-[hsl(var(--muted-foreground))] mb-2">
                        macOS Version
                      </h3>
                      <p className="text-sm">{selectedItem.macOSVersion}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-[hsl(var(--muted-foreground))] mb-2">
                        Device
                      </h3>
                      <p className="text-sm">{selectedItem.deviceModel}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-[hsl(var(--muted-foreground))] mb-2">
                        Disk Space
                      </h3>
                      <p className="text-sm">
                        {selectedItem.freeDiskSpace} free
                      </p>
                    </div>
                  </div>

                  <div className="mb-6">
                    <h3 className="text-sm font-medium text-[hsl(var(--muted-foreground))] mb-2">
                      Database Stats
                    </h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="bg-[hsl(var(--secondary))] rounded px-3 py-2">
                        <span className="text-[hsl(var(--muted-foreground))]">Sessions:</span>{" "}
                        {selectedItem.databaseStats.sessionCount.toLocaleString()}
                      </div>
                      <div className="bg-[hsl(var(--secondary))] rounded px-3 py-2">
                        <span className="text-[hsl(var(--muted-foreground))]">Frames:</span>{" "}
                        {selectedItem.databaseStats.frameCount.toLocaleString()}
                      </div>
                      <div className="bg-[hsl(var(--secondary))] rounded px-3 py-2">
                        <span className="text-[hsl(var(--muted-foreground))]">Segments:</span>{" "}
                        {selectedItem.databaseStats.segmentCount.toLocaleString()}
                      </div>
                      <div className="bg-[hsl(var(--secondary))] rounded px-3 py-2">
                        <span className="text-[hsl(var(--muted-foreground))]">DB Size:</span>{" "}
                        {selectedItem.databaseStats.databaseSizeMB.toFixed(1)} MB
                      </div>
                    </div>
                  </div>

                  {selectedItem.recentErrors.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-sm font-medium text-red-400 mb-2">
                        Recent Errors ({selectedItem.recentErrors.length})
                      </h3>
                      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 max-h-40 overflow-y-auto">
                        <pre className="text-xs text-red-300 whitespace-pre-wrap">
                          {selectedItem.recentErrors.join("\n")}
                        </pre>
                      </div>
                    </div>
                  )}

                  {selectedItem.recentLogs.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium text-[hsl(var(--muted-foreground))]">
                          Recent Logs ({selectedItem.recentLogs.length})
                        </h3>
                        {selectedItem.recentLogs.length > 50 && (
                          <button
                            onClick={() => setExpandedLogs(!expandedLogs)}
                            className="text-xs text-[hsl(var(--primary))] hover:underline"
                          >
                            {expandedLogs ? "Show less" : "Show all"}
                          </button>
                        )}
                      </div>
                      <div className={`bg-[hsl(var(--secondary))] rounded-lg p-3 overflow-y-auto ${expandedLogs ? "max-h-[500px]" : "max-h-60"}`}>
                        <pre className="text-xs text-[hsl(var(--muted-foreground))] whitespace-pre-wrap">
                          {expandedLogs
                            ? selectedItem.recentLogs.join("\n")
                            : selectedItem.recentLogs.slice(0, 50).join("\n")}
                          {!expandedLogs && selectedItem.recentLogs.length > 50 && (
                            <span className="text-[hsl(var(--primary))]">
                              {"\n"}... and {selectedItem.recentLogs.length - 50} more
                            </span>
                          )}
                        </pre>
                      </div>
                    </div>
                  )}

                  <div className="mt-6 pt-4 border-t border-[hsl(var(--border))]">
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">
                      Submitted: {formatDate(selectedItem.createdAt)}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-[hsl(var(--card))] rounded-xl border border-[hsl(var(--border))] p-12 text-center">
                  <p className="text-[hsl(var(--muted-foreground))]">
                    Select a feedback item to view details
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
