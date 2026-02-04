import { db, initDatabase } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

// Ensure table exists on first request
let dbInitialized = false;

export async function POST(request: NextRequest) {
  try {
    // Initialize database on first request
    if (!dbInitialized) {
      await initDatabase();
      dbInitialized = true;
    }

    const body = await request.json();
    const {
      version,
      source,
      os,
      osVersion,
      browser,
      browserVersion,
      architecture,
      platform,
      language,
      screenResolution,
      timezone,
      referrer,
      userAgent,
    } = body;

    // Get IP and geo info from request headers (works with Vercel/Cloudflare)
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0] ||
      request.headers.get("x-real-ip") ||
      "unknown";
    const country =
      request.headers.get("x-vercel-ip-country") ||
      request.headers.get("cf-ipcountry") ||
      "unknown";
    const city =
      request.headers.get("x-vercel-ip-city") ||
      request.headers.get("cf-ipcity") ||
      "unknown";
    const region =
      request.headers.get("x-vercel-ip-country-region") || "unknown";

    // Insert into database
    await db.execute({
      sql: `INSERT INTO downloads (
        version, source, os, os_version, browser, browser_version,
        architecture, platform, language, screen_resolution, timezone,
        referrer, user_agent, ip, country, city, region
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        version || null,
        source || null,
        os || null,
        osVersion || null,
        browser || null,
        browserVersion || null,
        architecture || null,
        platform || null,
        language || null,
        screenResolution || null,
        timezone || null,
        referrer || null,
        userAgent || null,
        ip,
        country,
        city,
        region,
      ],
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
  try {
    // Initialize database if needed
    if (!dbInitialized) {
      await initDatabase();
      dbInitialized = true;
    }

    // Get total downloads
    const totalResult = await db.execute("SELECT COUNT(*) as count FROM downloads");
    const totalDownloads = totalResult.rows[0]?.count || 0;

    // Get downloads by OS
    const byOsResult = await db.execute(`
      SELECT os, COUNT(*) as count
      FROM downloads
      GROUP BY os
      ORDER BY count DESC
    `);

    // Get downloads by source
    const bySourceResult = await db.execute(`
      SELECT source, COUNT(*) as count
      FROM downloads
      GROUP BY source
      ORDER BY count DESC
    `);

    // Get recent downloads (last 10 for display)
    const recentResult = await db.execute(`
      SELECT * FROM downloads
      ORDER BY created_at DESC
      LIMIT 10
    `);

    // Get downloads from last 48 hours for hourly chart
    const hourlyResult = await db.execute(`
      SELECT created_at FROM downloads
      WHERE created_at >= datetime('now', '-48 hours')
      ORDER BY created_at DESC
    `);

    // Get downloads from last 30 days for daily chart
    const dailyResult = await db.execute(`
      SELECT created_at FROM downloads
      WHERE created_at >= datetime('now', '-30 days')
      ORDER BY created_at DESC
    `);

    return NextResponse.json({
      totalDownloads,
      byOs: byOsResult.rows,
      bySource: bySourceResult.rows,
      recent: recentResult.rows,
      hourlyDownloads: hourlyResult.rows,
      dailyDownloads: dailyResult.rows,
    });
  } catch (error) {
    console.error("Error fetching download stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
