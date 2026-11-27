import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Prototype: static shells + Activity navigation (docs/dashboard-demo/CACHE_COMPONENTS_PLAN.md).
  cacheComponents: true,
  // Railway runs the self-contained server from .next/standalone (see Dockerfile).
  output: "standalone",
  experimental: {
    // Client router cache: a page you just visited (dynamic) is reused for 30s, so tab and
    // area switches are instant; prefetched pages for 3 minutes. Server actions that
    // revalidate still refresh what they change.
    staleTimes: { dynamic: 30, static: 180 },
  },
  // Hide development chrome only during reproducible visual captures.
  devIndicators: process.env.PLEROS_BASELINE_CAPTURE === "1" ? false : undefined,
  outputFileTracingIncludes: {
    "/api/welcome-pack/download": ["./private/welcome-pack/**/*"],
  },
  // Long-lived caching for the welcome videos and posters (these filenames are versioned),
  // so Cloudflare keeps them at the edge instead of revalidating with Railway.
  async headers() {
    return [
      "/site/sogp/sogp-welcome-WaXgk9zqi78.mp4",
      "/site/sogp/sogp-welcome-WaXgk9zqi78.jpg",
      "/site/sogp/sogp-welcome-square-20260831.mp4",
      "/site/sogp/sogp-welcome-square-20260831.jpg",
    ].map((source) => ({
      source,
      headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
    }));
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.ytimg.com",
      },
      {
        protocol: "https",
        hostname: "**.fna.fbcdn.net",
      },
      {
        protocol: "https",
        hostname: "**.cdninstagram.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "pleros.org",
      },
    ],
  },
};

export default nextConfig;
