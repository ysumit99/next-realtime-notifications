import { NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { Client } from "@upstash/qstash";
import { nanoid } from "nanoid";
import { AppNotification } from "@/lib/types";

const qstash = new Client({
  token: process.env.QSTASH_TOKEN!,
  // Explicitly targets the independent US regional infrastructure
  baseUrl: "https://qstash-us-east-1.upstash.io", 
});

// Helper function to dynamically map the public routing domain
const getBaseUrl = (req: Request) => {
  // 1. Prefer explicit environment variables for cloud tunneled routes
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }
  // 2. Fallback safely to native request headers
  const host = req.headers.get("host");
  const protocol = host?.includes("localhost") ? "http" : "https";
  return `${protocol}://${host}`;
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, message, type = "info", channels = ["in-app"] } = body;

    // Resolve the active base address securely
    const baseUrl = getBaseUrl(req);

    // 1. Construct the notification payload
    const notification: AppNotification = {
      id: nanoid(),
      type,
      title,
      message,
      channel: channels,
      read: false,
      createdAt: new Date().toISOString(),
    };

    // 2. Persist to Redis (Store in a sorted set by timestamp for efficient feed fetching)
    await redis.zadd("notifications:feed", {
      score: Date.now(),
      member: JSON.stringify(notification),
    });

    // ✨ NEW: The Auto-Pruner. 
    // This tells Redis: "Remove everything from index 0 up to the 11th item from the end."
    // It guarantees your database never holds more than the 10 most recent events.
    await redis.zremrangebyrank("notifications:feed", 0, -11);
    
    // 3. Fan-out Pattern via QStash
    if (channels.includes("email")) {
      // Simulate queuing an email task using the secure Base URL
      await qstash.publishJSON({
        url: `${baseUrl}/api/worker/email`,
        body: { notification },
      });
    }

    if (channels.includes("sms")) {
      // Simulate queuing an SMS task using the secure Base URL
      await qstash.publishJSON({
        url: `${baseUrl}/api/worker/sms`,
        body: { notification },
      });
    }

    // Publish to Redis Pub/Sub channel so the WS server picks it up instantly
    await redis.publish("realtime:notifications", JSON.stringify(notification));

    return NextResponse.json({ success: true, data: notification });
  } catch (error) {
    console.error("Notification Trigger Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}