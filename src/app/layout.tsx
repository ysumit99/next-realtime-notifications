import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "StaffNotify | Real-Time Engine",
  description: "Event-driven real-time notification architecture powered by Next.js, WebSockets, and Upstash Redis fan-out queues.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-slate-950 text-slate-100 min-h-screen">
        {children}
      </body>
    </html>
  );
}