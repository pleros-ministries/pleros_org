import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";

const googleConfigured =
  typeof process.env.GOOGLE_CLIENT_ID === "string" &&
  process.env.GOOGLE_CLIENT_ID.length > 0 &&
  typeof process.env.GOOGLE_CLIENT_SECRET === "string" &&
  process.env.GOOGLE_CLIENT_SECRET.length > 0;

export const betterAuthServer = betterAuth({
  appName: "Pleros PPC",
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
  secret:
    process.env.BETTER_AUTH_SECRET ??
    "demo-only-better-auth-secret-change-in-production-12345",
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: googleConfigured
    ? {
        google: {
          clientId: process.env.GOOGLE_CLIENT_ID!,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        },
      }
    : {},
  trustedOrigins: ["http://localhost:3000", "https://ppc.pleros.org"],
  plugins: [nextCookies()],
});
