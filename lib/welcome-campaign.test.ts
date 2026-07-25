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
    expect(viewSource).toContain('eyebrowLabel="Book access"');
    expect(viewSource).toContain('headline="Enter your email to get access"');
    expect(viewSource).toContain(
      "Add your first name and email so we can grant you access now.",
    );
    expect(viewSource).toContain("HomepageCommunitySection");
    expect(viewSource).toContain("<HomepageCommunitySection />");
    expect(viewSource).not.toContain("homeWhatsappChannelUrl");
    expect(drawerSource).toContain("headline = welcomePackModalCopy.headline");
    expect(drawerSource).toContain("subheadline = welcomePackModalCopy.subheadline");
    expect(drawerSource).toContain("redirectTo?: string");
    expect(drawerSource).toContain("autoOpen?: boolean");
    expect(drawerSource).toContain("returnTo: redirectTo");
  });

  test("uses the purpose book landing copy with a responsive public layout", () => {
    const viewSource = readFileSync(
      join(process.cwd(), "components", "home", "welcome-landing-page.tsx"),
      "utf8",
    );

    expect(viewSource).toContain("PublicSitePageShell");
    expect(viewSource).toContain("welcomePagePadding");
    expect(viewSource).toContain("welcome-book-cover.png");
    expect(viewSource).toContain(
      "Find the Answer to the Most Important Question of Your Life",
    );
    expect(viewSource).toContain("Simple, clear, direct, and precise answers");
    expect(viewSource).toContain("Your greatest burden");
    expect(viewSource).toContain("Why do we exist?");
    expect(viewSource).toContain("Not a guess");
    expect(viewSource).toContain("An exact answer to purpose");
    expect(viewSource).toContain("Absolutely free");
    expect(viewSource).toContain("25-30 minutes");
    expect(viewSource).toContain("45 minutes");
    expect(viewSource).toContain("Two more gifts");
    expect(viewSource).not.toContain("welcomeBookExcerpts");
    expect(viewSource).not.toContain("Selected excerpts from the book");
    expect(viewSource).not.toContain("bg-[#f3f7fb] px-0 md:px-6 md:py-6");
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
    const giftSource = readFileSync(
      join(process.cwd(), "lib", "welcome-pack-gifts.ts"),
      "utf8",
    );

    expect(pageSource).toContain("ThankYouPage");
    expect(pageSource).not.toContain("downloadUrl");
    expect(viewSource).not.toContain("Click here to access your book");
    expect(viewSource).toContain("Your free book is ready in your dashboard.");
    expect(viewSource).toContain('href="#book-access"');
    expect(viewSource).toContain('id="book-access"');
    expect(viewSource).toContain("Thank you for receiving your gift");
    expect(viewSource).toContain("Visit your dashboard to access your gift.");
    expect(viewSource).toContain('href="/dashboard/welcomepack"');
    expect(viewSource).toContain(
      "Get TWO special gifts today, when you recommend this book",
    );
    expect(viewSource).toContain("Help a friend, family, or stranger");
    expect(viewSource).toContain("Many people walk in perpetual doubt");
    expect(viewSource).toContain("all kinds of fleshly");
    expect(viewSource).toContain("bondages, and wasteful living");
    expect(viewSource).toContain("extraGifts");
    expect(viewSource).toContain("gift.imageSrc");
    expect(viewSource).toContain("<Image");
    expect(giftSource).toContain("Breaking Habits and Addictions as a New Creation");
    expect(giftSource).toContain("How the Gospel Proves Itself to Be the Truth");
    expect(giftSource).toContain(
      "/assets/dashboard/free-gift-book-covers/book-card-habits-addictions.png",
    );
    expect(giftSource).toContain(
      "/assets/dashboard/free-gift-book-covers/book-card-gospel-prove-truth.png",
    );
    expect(viewSource).toContain("Share on Telegram");
    expect(viewSource).toContain("Share on Facebook");
    expect(viewSource).toContain("Share on X");
    expect(viewSource).toContain('id="share-gift"');
    expect(viewSource).toContain('href="#share-gift"');
    expect(viewSource).toContain("Share this gift");
    expect(viewSource).toContain("t.me/share/url");
    expect(viewSource).toContain("facebook.com/sharer/sharer.php");
    expect(viewSource).toContain("twitter.com/intent/tweet");
    expect(viewSource).toContain("Don&apos;t postpone this");
    expect(viewSource).toContain("Someone&apos;s life and eternity may depend on it.");
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
