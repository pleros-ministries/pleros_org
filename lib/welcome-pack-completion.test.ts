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

  test("signup persists lead state and sends non-blocking welcome access email", () => {
    const apiSource = source("app", "api", "welcome-access", "route.ts");

    expect(apiSource).toContain("upsertWelcomePackLead");
    expect(apiSource).toContain("source");
    expect(apiSource).toContain("sendWelcomePackAccessEmail");
    expect(apiSource).toContain("catch((err)");
    expect(apiSource).toContain("return NextResponse.json({ redirectTo: returnTo })");
  });

  test("thank-you page prioritizes the share unlock block before the main gift block", () => {
    const pageSource = source("components", "home", "thank-you-page.tsx");

    expect(pageSource).toContain("confirmWelcomePackShareAction");
    expect(pageSource).toContain("I&apos;ve shared");
    expect(pageSource).toContain("Claim Free Gifts");
    expect(pageSource.indexOf("We have 2 more gifts for you")).toBeLessThan(
      pageSource.indexOf("Your main gift is already ready"),
    );
  });

  test("dashboard welcome pack displays main gifts immediately and locked extras until unlock", () => {
    const routeSource = source("app", "(site)", "dashboard", "welcomepack", "page.tsx");
    const pageSource = source("components", "dashboard", "welcome-pack-page.tsx");

    expect(routeSource).toContain("getWelcomePackLeadByEmail");
    expect(routeSource).toContain("extraGiftsUnlocked");
    expect(pageSource).toContain("mainGifts");
    expect(pageSource).toContain("extraGifts");
    expect(pageSource).toContain("Locked until you share");
    expect(pageSource).toContain("confirmWelcomePackShareAction");
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
