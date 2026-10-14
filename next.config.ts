import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
