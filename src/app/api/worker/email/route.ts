// src/app/api/worker/email/route.ts
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("✉️ [Worker: Email] Processing payload:", body.notification?.title);

    // Simulate third-party email dispatch delay (e.g., Resend, SendGrid)
    await new Promise((resolve) => setTimeout(resolve, 1000));

    return NextResponse.json({ success: true, delivered: true });
  } catch (error) {
    return NextResponse.json({ error: "Email processing failed" }, { status: 500 });
  }
}