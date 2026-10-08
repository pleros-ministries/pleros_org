import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, test } from "vitest";

// These modules reach the database when imported, so they are checked as
// source text rather than loaded.
function source(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

describe("reminder dispatcher cron", () => {
  test("is a strictly authenticated GET with room to finish a busy run", () => {
    const route = source("app", "api", "cron", "reminder-dispatch", "route.ts");

    expect(route).toContain("export async function GET");
    expect(route).toContain("export const maxDuration = 300");
    // Refuses when the secret is unset, not only when the header is wrong.
    expect(route).toContain("!process.env.CRON_SECRET");
    expect(route).toContain("`Bearer ${process.env.CRON_SECRET}`");
    expect(route).toContain("runReminderDispatcher");
  });

  test("claims a checkpoint before sending and never matches an exact minute", () => {
    const dispatcher = source("lib", "notifications", "dispatcher.ts");

    expect(dispatcher).toContain("claimCheckpoint");
    expect(dispatcher).toContain("releaseCheckpoint");
    expect(dispatcher).toContain("isDue(");
    expect(dispatcher).toContain("listReminderAudience");
    // The old Prayer Watch push only fired when the clock read exactly 05:20.
    expect(dispatcher).not.toContain('!== "05"');
    expect(dispatcher).not.toContain('!== "20"');
    // Reminder recipients are loaded with their devices, so the dispatcher
    // sends straight to them rather than through the per-user gate.
    expect(dispatcher).toContain("sendPushToSubscriptions");
    expect(dispatcher).not.toContain("sendPushToUser");
  });

  test("checkpoint claims are atomic", () => {
    const checkpoints = source(
      "lib",
      "db",
      "queries",
      "notification-checkpoints.ts",
    );

    expect(checkpoints).toContain("export async function claimCheckpoint");
    expect(checkpoints).toContain(".onConflictDoNothing()");
    expect(checkpoints).toContain(".returning(");
    expect(checkpoints).toContain("export async function pruneCheckpoints");
  });
});

describe("daily cron", () => {
  test("keeps discipleship, prunes old checkpoints and no longer sends Prayer Watch", () => {
    const route = source("app", "api", "cron", "sogp-reminders", "route.ts");

    expect(route).toContain("!process.env.CRON_SECRET");
    expect(route).toContain("runDiscipleshipCron");
    expect(route).toContain("pruneCheckpoints");
    expect(route).toContain("PRUNABLE_CHECKPOINT_PREFIXES");
    expect(route).not.toContain("sendPushToUser");
    expect(route).not.toContain("buildSogpPrayerWatchPushCandidate");
  });
});

describe("push sending", () => {
  test("removes subscriptions the push service reports as gone", () => {
    const send = source("lib", "push", "send.ts");

    expect(send).toContain("statusCode === 404 || statusCode === 410");
    expect(send).toContain("deletePushSubscriptions");
    expect(send).toContain("options: { gate: PushGate }");
  });

  test("community pushes respect the learner's preference", () => {
    const notify = source("lib", "community", "notify.ts");
    const messages = source(
      "app",
      "(site)",
      "dashboard",
      "community",
      "_actions",
      "message-actions.ts",
    );
    const staff = source("lib", "notifications", "staff-assignment.ts");

    expect(notify).toContain("listUsersWithCommunityPushOff");
    expect(messages).toContain('{ gate: "community" }');
    // Staff assignments are not a learner preference.
    expect(staff).toContain('{ gate: "none" }');
    expect(staff).not.toContain('gate: "community"');
  });

  test("a device is bound to the signed-in learner and leaves the anonymous list", () => {
    const route = source("app", "api", "sogp", "push", "subscribe", "route.ts");
    const queries = source(
      "lib",
      "db",
      "queries",
      "notification-preferences.ts",
    );

    expect(route).toContain("getAppSession");
    expect(route).toContain("bindPushSubscription");
    expect(queries).toContain("target: schema.pushSubscriptions.endpoint");
    expect(queries).toContain(".delete(schema.siteWebPushSubscriptions)");
  });
});

describe("anonymous subscribers", () => {
  test("the unscheduled public routes are left as they were", () => {
    // Scheduled sends to public-site subscribers are a separate decision, so
    // these routes still exist and are still not in vercel.json.
    const crons = (
      JSON.parse(source("vercel.json")) as { crons: Array<{ path: string }> }
    ).crons.map((cron) => cron.path);

    for (const name of ["prayer-watch-reminder", "new-video-check"]) {
      expect(
        existsSync(join(process.cwd(), "app", "api", "cron", name, "route.ts")),
      ).toBe(true);
      expect(crons).not.toContain(`/api/cron/${name}`);
    }
  });
});
