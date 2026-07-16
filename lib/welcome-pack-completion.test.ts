import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";

function source(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

describe("welcome pack completion wiring", () => {
  test("defines DB-backed lead state in the Drizzle schema", () => {
    const schemaSource = source("lib", "db", "schema.ts");

    expect(schemaSource).toContain("welcomePackLeads");
    expect(schemaSource).toContain('"welcome_pack_leads"');
    expect(schemaSource).toContain('email: text("email").notNull()');
    expect(schemaSource).toContain('mainAccessGranted: boolean("main_access_granted")');
    expect(schemaSource).toContain('extraGiftsUnlocked: boolean("extra_gifts_unlocked")');
    expect(schemaSource).toContain('sharedConfirmedAt: timestamp("shared_confirmed_at"');
    expect(schemaSource).toContain('uniqueIndex("welcome_pack_leads_email_idx")');
  });

  test("ships a Drizzle migration for welcome pack lead state", () => {
    const migrationSource = source("drizzle", "0003_welcome_pack_leads.sql");
    const journalSource = source("drizzle", "meta", "_journal.json");

    expect(migrationSource).toContain('CREATE TABLE "welcome_pack_leads"');
    expect(migrationSource).toContain('"email" text NOT NULL');
    expect(migrationSource).toContain('"main_access_granted" boolean DEFAULT true NOT NULL');
    expect(migrationSource).toContain('"extra_gifts_unlocked" boolean DEFAULT false NOT NULL');
    expect(migrationSource).toContain('"shared_confirmed_at" timestamp with time zone');
    expect(migrationSource).toContain('CREATE UNIQUE INDEX "welcome_pack_leads_email_idx"');
    expect(migrationSource).toContain('CREATE INDEX "welcome_pack_leads_created_at_idx"');
    expect(migrationSource).toContain('CREATE INDEX "welcome_pack_leads_extra_gifts_idx"');
    expect(journalSource).toContain('"tag": "0003_welcome_pack_leads"');
  });

  test("signup persists lead state and sends non-blocking welcome access email", () => {
    const apiSource = source("app", "api", "welcome-access", "route.ts");
    const querySource = source("lib", "db", "queries", "welcome-pack-leads.ts");

    expect(apiSource).toContain("upsertWelcomePackLead");
    expect(apiSource).toContain("source");
    expect(apiSource).toContain("sendWelcomePackAccessEmail");
    expect(apiSource).toContain("leadResult.created");
    expect(apiSource).toContain("dashboardUrl");
    expect(apiSource).not.toContain("buildWelcomePackDownloadUrl");
    expect(apiSource).not.toContain("downloadUrl");
    expect(querySource).toContain("onConflictDoNothing");
    expect(apiSource).toContain("catch((err)");
    expect(apiSource).toContain("return NextResponse.json({ redirectTo: returnTo })");
  });

  test("gift drawer prevents duplicate in-flight submissions without auto-triggering a download", () => {
    const drawerSource = source("components", "home", "homepage-gift-drawer.tsx");

    expect(drawerSource).toContain("isSubmittingRef.current");
    expect(drawerSource).toContain("disabled={isSubmitting || isPending}");
    expect(drawerSource).not.toContain("triggerWelcomePackDownload");
    expect(drawerSource).not.toContain("redirectAfterDownloadStarts");
    expect(drawerSource).toContain("window.location.href = payload.redirectTo");
  });

  test("unused welcome-pack modal (not wired into any page) still compiles and guards duplicate submissions", () => {
    const modalSource = source("components", "home", "welcome-pack-modal.tsx");

    expect(modalSource).toContain("isSubmittingRef.current");
    expect(modalSource).toContain("disabled={isSubmitting || isPending}");
    expect(modalSource).toContain("triggerWelcomePackDownload");
    expect(modalSource).toContain("redirectAfterDownloadStarts");
  });

  test("download route protects the welcome pack file and serves it as an attachment", () => {
    const routeSource = source("app", "api", "welcome-pack", "download", "route.ts");

    expect(routeSource).toContain("parseWelcomeAccessToken");
    expect(routeSource).toContain("WELCOME_ACCESS_COOKIE_NAME");
    expect(routeSource).toContain("getAppSession");
    expect(routeSource).toContain("resolveWelcomePackDownloadFilePath");
    expect(routeSource).toContain("Content-Disposition");
    expect(routeSource).toContain("attachment;");
  });

  test("thank-you page sends visitors to the dashboard instead of auto-downloading", () => {
    const pageSource = source("components", "home", "thank-you-page.tsx");

    expect(pageSource).toContain("Thank you for receiving your gift");
    expect(pageSource).toContain("Visit your dashboard to access your gift.");
    expect(pageSource).toContain('href="/dashboard/welcomepack"');
    expect(pageSource).toContain("Before you go, we have something more for you.");
    expect(pageSource).toContain("unlock two extra gifts");
    expect(pageSource).toContain("Share on WhatsApp");
    expect(pageSource).not.toContain("Your download has begun");
    expect(pageSource).not.toContain("downloadUrl");
    expect(pageSource).not.toContain("confirmWelcomePackShareAction");
  });

  test("dashboard welcome pack displays the main gift and marks supplementary packs as pending", () => {
    const routeSource = source("app", "(site)", "dashboard", "welcomepack", "page.tsx");
    const pageSource = source("components", "dashboard", "welcome-pack-page.tsx");

    expect(routeSource).toContain("getWelcomePackLeadByEmail");
    expect(routeSource).toContain("extraGiftsUnlocked");
    expect(pageSource).toContain("mainGifts");
    expect(pageSource).toContain("extraGifts");
    expect(pageSource).toContain("More resources are coming");
    expect(pageSource).toContain("The supplementary packs are not ready yet");
    expect(pageSource).not.toContain("Locked until you share");
    expect(pageSource).not.toContain("confirmWelcomePackShareAction");
  });

  test("admin welcome-pack page is present under the admin-only route group", () => {
    expect(
      existsSync(
        join(
          process.cwd(),
          "app",
          "admin",
          "(app)",
          "(admin-only)",
          "welcome-pack",
          "page.tsx",
        ),
      ),
    ).toBe(true);

    const pageSource = source(
      "app",
      "admin",
      "(app)",
      "(admin-only)",
      "welcome-pack",
      "page.tsx",
    );

    expect(pageSource).toContain("getWelcomePackLeadSummaries");
    expect(pageSource).toContain("Extra gifts");
    expect(pageSource).toContain("Shared confirmed");
  });
});
