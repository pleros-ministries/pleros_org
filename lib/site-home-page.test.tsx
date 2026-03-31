import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";

describe("site home page", () => {
  test("keeps the public homepage heading scale restrained on mobile", () => {
    const source = readFileSync(join(process.cwd(), "app", "globals.css"), "utf8");

    expect(source).toContain(
      "--text-display: clamp(2.125rem, 5.8vw, 3rem);",
    );
    expect(source).toContain(
      "--text-h1: clamp(2.25rem, 6.2vw, 3.15rem);",
    );
    expect(source).toContain(
      "--text-h2: clamp(2rem, 5.4vw, 2.65rem);",
    );
  });

  test("keeps the hero CTA scaled down while preserving a clear button shape", () => {
    const source = readFileSync(
      join(process.cwd(), "components", "home", "homepage-hero.tsx"),
      "utf8",
    );

    expect(source).toContain("min-h-[2.875rem]");
    expect(source).toContain("rounded-full");
    expect(source).toContain("px-6");
    expect(source).toContain("text-[0.875rem]");
  });

  test("keeps the pathway cards visually separated from the hero sky field", () => {
    const source = readFileSync(
      join(process.cwd(), "components", "home", "homepage-hero.tsx"),
      "utf8",
    );

    expect(source).toContain('<section className="bg-[var(--color-brand-sky)]');
    expect(source).toContain('<section id="pathways" className="bg-white');
  });

  test("uses Sen explicitly for pathway card titles", () => {
    const globalsSource = readFileSync(
      join(process.cwd(), "app", "globals.css"),
      "utf8",
    );
    const cardSource = readFileSync(
      join(process.cwd(), "components", "home", "homepage-pathway-card.tsx"),
      "utf8",
    );

    expect(globalsSource).toContain(".site-font-theme .site-pathway-title");
    expect(globalsSource).toContain('font-family: var(--font-sen), "Sen", var(--font-heading) !important;');
    expect(cardSource).toContain('className="site-pathway-title"');
  });

  test("builds pathway cards on top of the shared card primitive", () => {
    const cardSource = readFileSync(
      join(process.cwd(), "components", "home", "homepage-pathway-card.tsx"),
      "utf8",
    );

    expect(cardSource).toContain('from "../ui/card"');
    expect(cardSource).toContain("<Card");
    expect(cardSource).toContain("<CardContent");
  });

  test("keeps pathway cards broader on mobile with shorter top panels and heavier body copy", () => {
    const heroSource = readFileSync(
      join(process.cwd(), "components", "home", "homepage-hero.tsx"),
      "utf8",
    );
    const cardSource = readFileSync(
      join(process.cwd(), "components", "home", "homepage-pathway-card.tsx"),
      "utf8",
    );
    const contentSource = readFileSync(
      join(process.cwd(), "lib", "site-homepage-content.ts"),
      "utf8",
    );

    expect(heroSource).toContain('className="bg-white px-2 pb-[5rem] pt-5 sm:px-5"');
    expect(heroSource).toContain('className="grid grid-cols-2 gap-2 sm:gap-5"');
    expect(cardSource).toContain("h-[13.75rem]");
    expect(cardSource).toContain("h-[6.6rem]");
    expect(cardSource).toContain("px-3 pb-3.5 pt-3");
    expect(cardSource).toContain("font-medium");
    expect(contentSource).toContain('title: "Find Purpose"');
    expect(contentSource).toContain('mobileDescription: "Want to grow and be trained to fulfil purpose?"');
  });

  test("uses a refined hierarchy for the featured podcast card", () => {
    const globalsSource = readFileSync(
      join(process.cwd(), "app", "globals.css"),
      "utf8",
    );
    const sectionSource = readFileSync(
      join(process.cwd(), "components", "home", "homepage-podcast-section.tsx"),
      "utf8",
    );

    expect(globalsSource).toContain(".site-font-theme .site-podcast-card-label");
    expect(globalsSource).toContain(".site-font-theme .site-podcast-card-title");
    expect(globalsSource).toContain(".site-font-theme .site-podcast-card-date");
    expect(sectionSource).toContain('className="site-podcast-card-label"');
    expect(sectionSource).toContain('className="site-podcast-card-title');
    expect(sectionSource).toContain('className="site-podcast-card-date');
    expect(sectionSource).toContain("mt-5");
  });

  test("shows the full podcast thumbnail without the blue panel covering it", () => {
    const sectionSource = readFileSync(
      join(process.cwd(), "components", "home", "homepage-podcast-section.tsx"),
      "utf8",
    );

    expect(sectionSource).not.toContain("absolute inset-x-0 bottom-0");
    expect(sectionSource).toContain('className="grid overflow-hidden rounded-[11px] bg-[var(--color-brand-blue)]"');
    expect(sectionSource).toContain('className="h-auto w-full object-cover object-top"');
  });

  test("uses custom instagram-style cards for the curated social section", () => {
    const socialSource = readFileSync(
      join(process.cwd(), "components", "home", "homepage-social-section.tsx"),
      "utf8",
    );
    const viewSource = readFileSync(
      join(process.cwd(), "components", "home", "homepage-view.tsx"),
      "utf8",
    );
    const routeSource = readFileSync(
      join(process.cwd(), "app", "api", "social", "instagram", "route.ts"),
      "utf8",
    );
    const contentSource = readFileSync(
      join(process.cwd(), "lib", "site-homepage-content.ts"),
      "utf8",
    );

    expect(socialSource).toContain('"use client"');
    expect(socialSource).toContain("useEffect");
    expect(socialSource).toContain('fetch("/api/social/instagram"');
    expect(socialSource).toContain("HomepageSocialSection({ posts }");
    expect(socialSource).toContain("site-social-post-title");
    expect(socialSource).toContain("@pleros_org");
    expect(socialSource).not.toContain("<iframe");
    expect(socialSource).not.toContain("SafeInstagramEmbed");
    expect(socialSource).not.toContain("react-social-media-embed");
    expect(viewSource).toContain("getLatestInstagramPosts");
    expect(viewSource).toContain("<HomepageSocialSection posts={instagramPosts} />");
    expect(routeSource).toContain("getLatestInstagramPosts");
    expect(routeSource).toContain("NextResponse.json");
    expect(routeSource).toContain('"Cache-Control": "no-store"');
    expect(contentSource).toContain('export const homeInstagramProfileUrl = "https://instagram.com/pleros_org";');
    expect(viewSource).not.toContain("getInstagramReelPreviews");
  });

  test("styles the mobile menu with site typography and a visible white close control", () => {
    const navSource = readFileSync(
      join(process.cwd(), "components", "home", "homepage-nav.tsx"),
      "utf8",
    );
    const globalsSource = readFileSync(
      join(process.cwd(), "app", "globals.css"),
      "utf8",
    );

    expect(navSource).toContain("site-mobile-menu-title");
    expect(navSource).toContain("site-mobile-menu-link");
    expect(navSource).toContain("className=\"site-font-theme border-l border-white/8");
    expect(navSource).toContain("aria-label=\"Close menu\"");
    expect(navSource).toContain("inline-flex h-10 w-10 items-center justify-center text-white transition-opacity duration-150 hover:opacity-80");
    expect(navSource).toContain("border-b border-white/10 py-3 font-medium text-white/94");
    expect(globalsSource).toContain(".site-font-theme .site-mobile-menu-title");
    expect(globalsSource).toContain(".site-font-theme .site-mobile-menu-link");
    expect(globalsSource).toContain('font-family: var(--font-sen), "Sen", var(--font-heading) !important;');
  });

  test("wires a homepage-only free gift drawer using the shared bottom sheet pattern", () => {
    const viewSource = readFileSync(
      join(process.cwd(), "components", "home", "homepage-view.tsx"),
      "utf8",
    );
    const drawerSource = readFileSync(
      join(process.cwd(), "components", "home", "homepage-gift-drawer.tsx"),
      "utf8",
    );

    expect(viewSource).toContain("HomepageGiftDrawer");
    expect(viewSource).toContain("<HomepageGiftDrawer hasWelcomeAccess={Boolean(welcomeAccess)} />");
    expect(drawerSource).toContain('side="bottom"');
    expect(drawerSource).toContain("Get your free welcome pack");
    expect(drawerSource).toContain("The first resources you need to begin your Pleros journey");
    expect(drawerSource).toContain('placeholder="Email address"');
    expect(drawerSource).toContain("access welcome pck");
    expect(drawerSource).toContain("rounded-t-[1.75rem]");
    expect(drawerSource).not.toContain("Instant dashboard access");
    expect(drawerSource).not.toContain("Private welcome pack");
    expect(drawerSource).not.toContain("We&apos;ll take you straight into your dashboard after submit.");
    expect(drawerSource).toContain("WELCOME_PACK_STORAGE_KEY");
    expect(drawerSource).toContain('fetch("/api/welcome-access"');
    expect(drawerSource).toContain('window.location.href = payload.redirectTo');
  });

  test("wires the root route to the restored homepage instead of redirecting to PPC", () => {
    const source = readFileSync(
      join(process.cwd(), "app", "(site)", "page.tsx"),
      "utf8",
    );

    expect(source).toContain("HomepageView");
    expect(source).not.toContain('redirect("/ppc/sign-in")');
  });
});
