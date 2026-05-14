import type { NextConfig } from "next";

// Helper to safely extract just the hostname from a full URL string
const getDevOrigin = () => {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_ALLOWED_ORIGIN;
  if (!appUrl) return [];

  try {
    // If it's a full URL (https://...), parse out just the clean host
    if (appUrl.startsWith("http")) {
      return [new URL(appUrl).host];
    }
    // Otherwise, assume it's already a clean hostname string
    return [appUrl];
  } catch (error) {
    console.warn("Failed to parse dev origin URL in next.config.ts", error);
    return [];
  }
};

const nextConfig: NextConfig = {
  // Dynamically injects your secure tunnel host without hardcoding strings
  allowedDevOrigins: getDevOrigin(),
};

export default nextConfig;