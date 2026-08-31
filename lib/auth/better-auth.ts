import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { emailOTP } from "better-auth/plugins";
import { twoFactor } from "better-auth/plugins/two-factor";

import { db } from "@/lib/db";
import * as authSchema from "@/lib/db/auth-schema";
import { buildTrustedOrigins, resolveAuthBaseUrl } from "@/lib/auth/auth-env";
import { ensureAppUserRecord } from "@/lib/app-user";
import {
  sendEmailVerification,
  sendPasswordReset,
  sendSogpAuthCodeEmail,
} from "@/lib/email/send";
import { SOGP_OTP_TTL_SECONDS } from "@/lib/sogp/auth-flow";

const googleConfigured =
  typeof process.env.GOOGLE_CLIENT_ID === "string" &&
  process.env.GOOGLE_CLIENT_ID.length > 0 &&
  typeof process.env.GOOGLE_CLIENT_SECRET === "string" &&
  process.env.GOOGLE_CLIENT_SECRET.length > 0;

export const betterAuthServer = betterAuth({
  appName: "Pleros Ministries and Missions",
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
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, url }) => {
      await sendPasswordReset({
        to: user.email,
        name: user.name,
        resetUrl: url,
      });
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    sendOnSignIn: true,
    autoSignInAfterVerification: true,
    expiresIn: 60 * 60,
    sendVerificationEmail: async ({ user, url }) => {
      await sendEmailVerification({
        to: user.email,
        name: user.name,
        verificationUrl: url,
      });
    },
    afterEmailVerification: async (user) => {
      await ensureAppUserRecord({
        id: user.id,
        name: user.name,
        email: user.email,
        emailVerified: true,
      });
    },
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 60,
      strategy: "jwe",
    },
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
    emailOTP({
      disableSignUp: true,
      otpLength: 6,
      expiresIn: SOGP_OTP_TTL_SECONDS,
      allowedAttempts: 3,
      storeOTP: "hashed",
      rateLimit: { window: 60, max: 3 },
      async sendVerificationOTP({ email, otp, type }) {
        const result = await sendSogpAuthCodeEmail({ to: email, otp, type });
        if (!result) {
          throw new Error("SOGP verification email delivery is unavailable.");
        }
      },
    }),
    twoFactor({ issuer: "Pleros" }),
    nextCookies(),
  ],
});
