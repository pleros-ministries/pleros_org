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

  test("uses real book excerpts and flourish styling on the welcome sneak peek", () => {
    const viewSource = readFileSync(
      join(process.cwd(), "components", "home", "welcome-landing-page.tsx"),
      "utf8",
    );

    expect(viewSource).toContain("welcomeBookExcerpts");
    expect(viewSource).toContain("30 pages of clarity");
    expect(viewSource).not.toContain("Just 15 pages");
    expect(viewSource).toContain("Selected excerpts from the book");
    expect(viewSource).not.toContain("Selected pages from the book");
    expect(viewSource).toContain("Purpose requires revelation");
    expect(viewSource).toContain("Natural assignment");
    expect(viewSource).toContain("Our natural pursuits should not be regarded");
    expect(viewSource).not.toContain("Sonship as God's purpose");
    expect(viewSource).not.toContain("God has revealed His purpose for us to be Sonship");
    expect(viewSource).not.toContain("Final affirmation");
    expect(viewSource).not.toContain("I am driven by the Spirit");
    expect(viewSource).toContain("✾");
    expect(viewSource).toContain("✦");
    expect(viewSource).not.toContain("function as cliffhangers");
  });

  test("wires the thank you page to the dashboard gift and WhatsApp share intent", () => {
    const pageSource = readFileSync(
      join(process.cwd(), "app", "(site)", "thankyou", "page.tsx"),
      "utf8",
    );
    const viewSource = readFileSync(
      join(process.cwd(), "components", "home", "thank-you-page.tsx"),
      "utf8",
    );

    expect(pageSource).toContain("ThankYouPage");
    expect(pageSource).toContain('downloadUrl="/api/welcome-pack/download"');
    expect(viewSource).toContain("Your download has begun");
    expect(viewSource).toContain("Download welcome pack");
    expect(viewSource).toContain("also sent the link to your email");
    expect(viewSource).toContain('href="/dashboard"');
    expect(viewSource).toContain("Share this free gift with someone");
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
    const href = buildWelcomeShareIntentUrl("https://pleros.org");
    const url = new URL(href);

    expect(url.origin).toBe("https://wa.me");
    expect(url.searchParams.get("text")).toBe(
      "I found a free gift from Pleros that I thought would bless you. You can access it here: https://pleros.org/welcome",
    );
  });

  test("resolves the public site URL with a canonical production fallback", () => {
    expect(
      resolvePublicSiteUrl({
        NEXT_PUBLIC_SITE_URL: "https://example.com/path",
      } as unknown as NodeJS.ProcessEnv),
    ).toBe("https://example.com");
    expect(
      resolvePublicSiteUrl({
        NEXT_PUBLIC_APP_URL: "https://pleros-org.vercel.app",
      } as unknown as NodeJS.ProcessEnv),
    ).toBe("https://pleros.org");
    expect(resolvePublicSiteUrl({} as unknown as NodeJS.ProcessEnv)).toBe(
      "https://pleros.org",
    );
  });
});
