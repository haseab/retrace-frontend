"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Download, TrendingUp, Users, Package } from "lucide-react";
import { SectionHeader } from "@/components/ui/section-header";

interface DownloadStat {
  version: string;
  platform: string;
  count: number;
}

interface Stats {
  totalDownloads: number;
  stats: DownloadStat[];
}

export default function StatsPage() {
  const [stats, setStats] = useState<Stats>({ totalDownloads: 0, stats: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/downloads/track")
      .then((res) => res.json())
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Failed to fetch stats:", error);
        setLoading(false);
      });
  }, []);

  const platformStats = stats.stats.reduce(
    (acc, stat) => {
      acc[stat.platform] = (acc[stat.platform] || 0) + stat.count;
      return acc;
    },
    {} as Record<string, number>
  );

  const versionStats = stats.stats.reduce(
    (acc, stat) => {
      acc[stat.version] = (acc[stat.version] || 0) + stat.count;
      return acc;
    },
    {} as Record<string, number>
  );

  if (loading) {
    return (
      <div className="pt-24 pb-20">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto" />
            <p className="text-muted-foreground">Loading stats...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-20">
      <section className="px-4 sm:px-6 lg:px-8 py-12">
        <div className="mx-auto max-w-5xl space-y-12">
          <SectionHeader
            title="Download Statistics"
            subtitle="Public download metrics for Retrace (updated in real-time)"
            centered
          />

          {/* Overview Stats */}
          <div className="grid gap-6 md:grid-cols-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="rounded-lg border border-border bg-card p-6 space-y-2"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Total Downloads
                </h3>
                <Download className="h-4 w-4 text-primary" />
              </div>
              <p className="text-3xl font-bold">
                {stats.totalDownloads.toLocaleString()}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="rounded-lg border border-border bg-card p-6 space-y-2"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Versions
                </h3>
                <Package className="h-4 w-4 text-primary" />
              </div>
              <p className="text-3xl font-bold">
                {Object.keys(versionStats).length || "—"}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="rounded-lg border border-border bg-card p-6 space-y-2"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Platforms
                </h3>
                <Users className="h-4 w-4 text-primary" />
              </div>
              <p className="text-3xl font-bold">
                {Object.keys(platformStats).length || "—"}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="rounded-lg border border-border bg-card p-6 space-y-2"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Trend
                </h3>
                <TrendingUp className="h-4 w-4 text-green-500" />
              </div>
              <p className="text-3xl font-bold text-green-500">↑</p>
            </motion.div>
          </div>

          {/* Platform Distribution */}
          {Object.keys(platformStats).length > 0 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">Platform Distribution</h2>
              <div className="grid gap-4 md:grid-cols-2">
                {Object.entries(platformStats).map(([platform, count], index) => {
                  const percentage = (
                    (count / stats.totalDownloads) *
                    100
                  ).toFixed(1);
                  return (
                    <motion.div
                      key={platform}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      className="rounded-lg border border-border bg-card p-6 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold">{platform}</h3>
                        <span className="text-2xl font-bold">{count}</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {percentage}% of total downloads
                      </p>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Version Distribution */}
          {Object.keys(versionStats).length > 0 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">Version Distribution</h2>
              <div className="space-y-3">
                {Object.entries(versionStats)
                  .sort(([, a], [, b]) => b - a)
                  .map(([version, count], index) => {
                    const percentage = (
                      (count / stats.totalDownloads) *
                      100
                    ).toFixed(1);
                    return (
                      <motion.div
                        key={version}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                        className="rounded-lg border border-border bg-card p-6 space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold">v{version}</h3>
                          <span className="text-xl font-bold">{count}</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {percentage}% of total downloads
                        </p>
                      </motion.div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Empty State */}
          {stats.totalDownloads === 0 && (
            <div className="rounded-xl border border-border bg-card p-12 text-center">
              <Download className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No downloads yet</h3>
              <p className="text-muted-foreground">
                Download statistics will appear here once Retrace starts being
                downloaded.
              </p>
            </div>
          )}

          {/* Privacy Note */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="rounded-xl border border-border bg-muted/30 p-6 space-y-2"
          >
            <h3 className="font-semibold">Privacy Note</h3>
            <p className="text-sm text-muted-foreground">
              These statistics are collected anonymously. We only track download
              counts, platform types, and version numbers. No IP addresses,
              device identifiers, or personal information is collected or
              stored.
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
