import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Whitelist your active ngrok host to unblock background dev resources

  allowedDevOrigins: process.env.NEXT_PUBLIC_ALLOWED_ORIGIN
  ? [process.env.NEXT_PUBLIC_ALLOWED_ORIGIN]
  : [],
};

export default nextConfig;