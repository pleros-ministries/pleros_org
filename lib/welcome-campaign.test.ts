import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";

import {
  buildWelcomeShareIntentUrl,
  resolvePublicSiteUrl,
} from "./welcome-campaign";

describe("welcome campaign pages", () => {
  test("wires the welcome landing page to the manual drawer flow", () => {
    const pageSource = readFileSync(
      join(process.cwd(), "app", "(site)", "welcome", "page.tsx"),
      "utf8",
    );
    const viewSource = readFileSync(
      join(process.cwd(), "components", "home", "welcome-landing-page.tsx"),
      "utf8",
    );
    const drawerSource = readFileSync(
      join(process.cwd(), "components", "home", "homepage-gift-drawer.tsx"),
      "utf8",
    );

    expect(pageSource).toContain("WelcomeLandingPage");
    expect(pageSource).toContain("getAppSession");
    expect(pageSource).toContain("appSession || welcomeAccess");
    expect(pageSource).toContain('redirect("/dashboard")');
    expect(viewSource).toContain("Get your free book");
    expect(viewSource).toContain('redirectTo="/thankyou"');
    expect(viewSource).toContain("autoOpen={false}");
    expect(drawerSource).toContain("redirectTo?: string");
    expect(drawerSource).toContain("autoOpen?: boolean");
    expect(drawerSource).toContain("returnTo: redirectTo");
  });

  test("wires the thank you page to the welcome pack dashboard and WhatsApp share intent", () => {
    const pageSource = readFileSync(
      join(process.cwd(), "app", "(site)", "thankyou", "page.tsx"),
      "utf8",
    );
    const viewSource = readFileSync(
      join(process.cwd(), "components", "home", "thank-you-page.tsx"),
      "utf8",
    );

    expect(pageSource).toContain("ThankYouPage");
    expect(pageSource).not.toContain("downloadUrl");
    expect(viewSource).toContain("Thank you for receiving your gift");
    expect(viewSource).toContain("Visit your dashboard to access your gift.");
    expect(viewSource).toContain('href="/dashboard/welcomepack"');
    expect(viewSource).toContain("Before you go, we have something more for you.");
    expect(viewSource).toContain("Share on WhatsApp");
    expect(viewSource).toContain("buildWelcomeShareIntentUrl");
    expect(viewSource).not.toContain("confirmWelcomePackShareAction");
  });

  test("uses the welcome session route only as a cookie bootstrap", () => {
    const routeSource = readFileSync(
      join(process.cwd(), "app", "api", "welcome-access", "session", "route.ts"),
      "utf8",
    );

    expect(routeSource).toContain('new URL("/welcome", request.url)');
    expect(routeSource).toContain("getWelcomeAccessCookieOptions");
    expect(routeSource).toContain("response.cookies.set");
  });
});

describe("welcome campaign helpers", () => {
  test("builds a generic WhatsApp share intent for the welcome landing page", () => {
    const href = buildWelcomeShareIntentUrl("https://pleros-org.vercel.app");
    const url = new URL(href);

    expect(url.origin).toBe("https://wa.me");
    expect(url.searchParams.get("text")).toBe(
      "I found a free gift from Pleros that I thought would bless you. You can access it here: https://pleros-org.vercel.app/welcome",
    );
  });

  test("resolves the public site URL with a production fallback", () => {
    expect(
      resolvePublicSiteUrl({
        NEXT_PUBLIC_APP_URL: "https://example.com/path",
      } as unknown as NodeJS.ProcessEnv),
    ).toBe("https://example.com");
    expect(resolvePublicSiteUrl({} as unknown as NodeJS.ProcessEnv)).toBe(
      "https://pleros-org.vercel.app",
    );
  });
});
