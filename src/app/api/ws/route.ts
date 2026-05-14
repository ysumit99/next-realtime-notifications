import { NextRequest } from "next/server";
import { redis } from "@/lib/redis";
import { AppNotification } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const encoder = new TextEncoder();

  const customReadable = new ReadableStream({
    async start(controller) {
      // 1. Send an immediate handshake confirmation to turn the frontend badge green
      controller.enqueue(encoder.encode("event: connected\ndata: OK\n\n"));

      // Track the high-water mark timestamp cursor
      let lastCheck = Date.now();

      // 2. Poll the Upstash Sorted Set periodically for brand new entries
      const interval = setInterval(async () => {
        try {
          // Fetch any nodes scored strictly higher than our last execution cycle
          const newItems = await redis.zrange("notifications:feed", lastCheck + 1, "+inf", {
            byScore: true,
          });

          if (newItems && newItems.length > 0) {
            for (const item of newItems) {
              // Upstash automatically parses stored JSON strings to objects, handle both safely
              const payloadString = typeof item === "string" ? item : JSON.stringify(item);
              
              // Push the live event chunk down the established EventSource stream
              controller.enqueue(encoder.encode(`data: ${payloadString}\n\n`));

              // Update our high-water mark cursor to the latest item's creation timestamp
              const parsed: AppNotification = typeof item === "string" ? JSON.parse(item) : item;
              const itemTime = new Date(parsed.createdAt).getTime();
              if (itemTime > lastCheck) {
                lastCheck = itemTime;
              }
            }
          }

          // Emit a lightweight keep-alive comment to prevent intermediate proxy drops
          controller.enqueue(encoder.encode(": heartbeat\n\n"));
        } catch (err) {
          console.error("SSE Stream Upstash Polling Error:", err);
        }
      }, 3000); // Polls cleanly every 3 seconds

      // 3. Purge background intervals instantly when the client tab terminates
      req.signal.addEventListener("abort", () => {
        clearInterval(interval);
      });
    },
  });

  return new Response(customReadable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no", // Bypass reverse-proxy response chunk buffering
    },
  });
}