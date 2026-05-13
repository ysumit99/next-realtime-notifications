import { NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { AppNotification } from "@/lib/types";

export async function GET() {
  try {
    // Fetch top 50 most recent notifications sorted descending
    const rawNotifications = await redis.zrange<string[]>(
      "notifications:feed",
      0,
      49,
      { rev: true }
    );

    // Parse Redis strings back to JSON objects
    const notifications: AppNotification[] = rawNotifications.map((n) =>
      typeof n === "string" ? JSON.parse(n) : n
    );

    return NextResponse.json({ notifications });
  } catch (error) {
    console.error("Failed to fetch feed:", error);
    return NextResponse.json(
      { error: "Failed to load notifications" },
      { status: 500 }
    );
  }
}