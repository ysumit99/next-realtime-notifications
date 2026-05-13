import { NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { Client } from "@upstash/qstash";
import { nanoid } from "nanoid";
import { AppNotification } from "@/lib/types";

const qstash = new Client({ token: process.env.QSTASH_TOKEN || "" });

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, message, type = "info", channels = ["in-app"] } = body;

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

    // Optional: Set a TTL or cap the list to prevent infinite storage growth
    // await redis.zremrangebyrank("notifications:feed", 0, -101); // Keep last 100

    // 3. Fan-out Pattern via QStash
    // If we are targeting multiple delivery avenues, we publish to a QStash topic or direct endpoints
    if (channels.includes("email")) {
      // Simulate queuing an email task
      await qstash.publishJSON({
        url: `https://${req.headers.get("host")}/api/worker/email`,
        body: { notification },
      });
    }

    if (channels.includes("sms")) {
      // Simulate queuing an SMS task
      await qstash.publishJSON({
        url: `https://${req.headers.get("host")}/api/worker/sms`,
        body: { notification },
      });
    }

    // For In-App real-time delivery, if using a custom WS server or external provider:
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