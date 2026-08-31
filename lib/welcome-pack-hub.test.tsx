import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";

import {
  WelcomePackGiftsPage,
  WelcomePackHubPage,
  WelcomePackJoinPage,
  WelcomePackOrientationPage,
} from "../components/dashboard/welcome-pack-pages";
import { getWelcomePackHubCards } from "./welcome-pack-hub";

describe("Welcome Pack hub", () => {
  test("routes the three hub cards to dedicated subpages", () => {
    expect(getWelcomePackHubCards("/dashboard/welcomepack")).toEqual([
      expect.objectContaining({
        title: "Welcome message",
        href: "/dashboard/welcomepack/join",
      }),
      expect.objectContaining({
        title: "Orientation",
        href: "/dashboard/welcomepack/orientation",
      }),
      expect.objectContaining({
        title: "Gifts",
        href: "/dashboard/welcomepack/gifts",
      }),
    ]);
  });

  test("supports sign-in-free preview destinations without changing card content", () => {
    expect(
      getWelcomePackHubCards("/preview/dashboard/welcomepack").map(
        ({ href }) => href,
      ),
    ).toEqual([
      "/preview/dashboard/welcomepack/join",
      "/preview/dashboard/welcomepack/orientation",
      "/preview/dashboard/welcomepack/gifts",
    ]);
  });

  test("renders the hub as three focused destinations", () => {
    const html = renderToStaticMarkup(<WelcomePackHubPage />);
    expect(html).toContain("Your Welcome Pack");
    expect(html).toContain("Welcome message");
    expect(html).toContain("Orientation");
    expect(html).toContain("Gifts");
    expect(html).toContain("font-semibold");
    expect(html).toContain("site-pathway-title");
    expect(html).not.toContain("font-bold");
    expect(html).not.toContain("Join the orientation group");
  });

  test("renders the hub preview inside the shared navigation and footer", () => {
    const source = readFileSync(
      join(
        process.cwd(),
        "app",
        "preview",
        "dashboard",
        "welcomepack",
        "layout.tsx",
      ),
      "utf8",
    );
    expect(source).toContain("AppShell");
    expect(source).toContain("<AppShell>{children}</AppShell>");
  });
});

describe("focused Welcome Pack pages", () => {
  test("uses the bundled welcome media on live and preview join routes", () => {
    const routeSources = [
      join(
        process.cwd(),
        "app",
        "(focused)",
        "dashboard",
        "welcomepack",
        "join",
        "page.tsx",
      ),
      join(
        process.cwd(),
        "app",
        "(preview-focused)",
        "preview",
        "dashboard",
        "welcomepack",
        "join",
        "page.tsx",
      ),
    ].map((path) => readFileSync(path, "utf8"));

    for (const source of routeSources) {
      expect(source).toContain("WELCOME_PACK_JOIN_VIDEO_SRC");
      expect(source).toContain("WELCOME_PACK_JOIN_POSTER_SRC");
    }

    const componentSource = readFileSync(
      join(
        process.cwd(),
        "components",
        "dashboard",
        "welcome-pack-pages.tsx",
      ),
      "utf8",
    );
    expect(componentSource).toContain("poster={videoPosterSrc ?? undefined}");
  });

  test("preserves the square framing of the welcome video", () => {
    const html = renderToStaticMarkup(
      <WelcomePackJoinPage
        telegramUrl="https://t.me/pleros_sogp"
        videoSrc="/site/sogp/sogp-welcome-page-20260831.mp4"
      />,
    );

    expect(html).toContain("sogp-welcome-page-20260831.mp4");
    expect(html).toContain("aspect-square");
    expect(html).toContain("object-contain");
    expect(html).not.toContain("aspect-video");
  });

  test("keeps the welcome message focused on one Telegram action", () => {
    const html = renderToStaticMarkup(
      <WelcomePackJoinPage
        telegramUrl="https://t.me/pleros_sogp"
        videoSrc={null}
      />,
    );
    expect(html.match(/<a /g)).toHaveLength(1);
    expect(html).toContain("Welcome to SOGP");
    expect(html).not.toContain("Welcome to Pleros");
    expect(html).toContain("Your journey of Purpose starts here");
    expect(html).not.toContain("Your journey starts here");
    expect(html).toContain("Join the orientation group");
    expect(html).not.toContain("lucide-send");
    expect(html).toContain(
      "Join your cohort community on Telegram for your orientation pack and the next steps to take.",
    );
    expect(html).not.toContain("for your orientation message");
    expect(html).toContain("https://t.me/pleros_sogp");
    expect(html).toContain("Welcome message video coming soon");
    expect(html).toContain("grid-cols-[minmax(0,1fr)]");
    expect(html).toContain("min-w-0");
    expect(html).toContain("max-w-full");
    expect(html).not.toContain("sogp-welcome-WaXgk9zqi78.mp4");
    expect(html).not.toContain("Orientation video");
    expect(html).not.toContain("Your gifts");
  });

  test("keeps orientation and gifts on their own pages", () => {
    const orientationHtml = renderToStaticMarkup(
      <WelcomePackOrientationPage
        videoSrc="/site/sogp/sogp-welcome-WaXgk9zqi78.mp4"
      />,
    );
    const giftsHtml = renderToStaticMarkup(
      <WelcomePackGiftsPage extraGiftsUnlocked={false} />,
    );
    expect(orientationHtml).toContain("Orientation video");
    expect(orientationHtml).toContain("sogp-welcome-WaXgk9zqi78.mp4");
    expect(orientationHtml).not.toContain("site-hero-eyebrow");
    expect(giftsHtml).not.toContain("site-hero-eyebrow");
    expect(orientationHtml).toContain("uppercase");
    expect(orientationHtml).toContain("Welcome Pack");
    expect(giftsHtml).toContain("Welcome to Purpose (ebook)");
    expect(giftsHtml).toContain("Welcome to Purpose (Audiobook)");
  });
});
