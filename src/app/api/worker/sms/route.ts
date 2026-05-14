// src/app/api/worker/sms/route.ts
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("📱 [Worker: SMS] Processing payload:", body.notification?.title);

    // Simulate third-party SMS dispatch delay (e.g., Twilio)
    await new Promise((resolve) => setTimeout(resolve, 500));

    return NextResponse.json({ success: true, delivered: true });
  } catch (error) {
    return NextResponse.json({ error: "SMS processing failed" }, { status: 500 });
  }
}