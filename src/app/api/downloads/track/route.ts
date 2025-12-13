import { NextRequest, NextResponse } from "next/server";

// In-memory storage for demo purposes
// In production, use a database like PostgreSQL, SQLite, or KV store
const downloadStats = new Map<string, number>();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { version, platform, source } = body;

    // Validate input
    if (!version || !platform) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Track download
    const key = `${version}-${platform}`;
    const currentCount = downloadStats.get(key) || 0;
    downloadStats.set(key, currentCount + 1);

    // Log for debugging (in production, save to database)
    console.log("Download tracked:", {
      version,
      platform,
      source,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: "Download tracked successfully",
    });
  } catch (error) {
    console.error("Error tracking download:", error);
    return NextResponse.json(
      { error: "Failed to track download" },
      { status: 500 }
    );
  }
}

export async function GET() {
  // Return stats
  const stats = Array.from(downloadStats.entries()).map(([key, count]) => {
    const [version, platform] = key.split("-");
    return { version, platform, count };
  });

  const totalDownloads = Array.from(downloadStats.values()).reduce(
    (sum, count) => sum + count,
    0
  );

  return NextResponse.json({
    totalDownloads,
    stats,
  });
}
