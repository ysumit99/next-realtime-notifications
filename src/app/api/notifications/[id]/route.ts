import { NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { AppNotification } from "@/lib/types";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;

    // Fetch the active chronological set
    const notifications: string[] = await redis.zrange("notifications:feed", 0, -1);
    
    for (const item of notifications) {
      const parsed: AppNotification = JSON.parse(item);
      if (parsed.id === id) {
        // Remove the outdated unread node
        await redis.zrem("notifications:feed", item);
        
        // Re-insert the updated node with the read flag flipped to true
        parsed.read = true;
        await redis.zadd("notifications:feed", {
          score: new Date(parsed.createdAt).getTime(),
          member: JSON.stringify(parsed),
        });
        break;
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update notification state" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;

    const notifications: string[] = await redis.zrange("notifications:feed", 0, -1);
    
    for (const item of notifications) {
      const parsed: AppNotification = JSON.parse(item);
      if (parsed.id === id) {
        // Safely strip the specific target item out of the sorted set
        await redis.zrem("notifications:feed", item);
        break;
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete notification node" }, { status: 500 });
  }
}