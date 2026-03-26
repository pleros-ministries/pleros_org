import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { twoFactor } from "better-auth/plugins/two-factor";

import { db } from "@/lib/db";
import * as authSchema from "@/lib/db/auth-schema";
import { buildTrustedOrigins, resolveAuthBaseUrl } from "@/lib/auth/auth-env";

const googleConfigured =
  typeof process.env.GOOGLE_CLIENT_ID === "string" &&
  process.env.GOOGLE_CLIENT_ID.length > 0 &&
  typeof process.env.GOOGLE_CLIENT_SECRET === "string" &&
  process.env.GOOGLE_CLIENT_SECRET.length > 0;

export const betterAuthServer = betterAuth({
  appName: "Pleros PPC",
  baseURL: resolveAuthBaseUrl(process.env),
  secret:
    process.env.BETTER_AUTH_SECRET ??
    "demo-only-better-auth-secret-change-in-production-12345",
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: authSchema,
  }),
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
  trustedOrigins: buildTrustedOrigins(process.env),
  plugins: [
    nextCookies(),
    twoFactor({ issuer: "Pleros PPC" }),
  ],
});
