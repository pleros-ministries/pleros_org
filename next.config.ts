import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
