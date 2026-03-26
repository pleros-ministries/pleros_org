import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
