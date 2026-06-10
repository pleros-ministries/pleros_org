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
    expect(contentSource).toContain('mobileDescription: "Want to grow and be trained to fulfill purpose?"');
  });

  test("keeps the dashboard menu link pointed to /dashboard and updates the church pathway copy", () => {
    const contentSource = readFileSync(
      join(process.cwd(), "lib", "site-homepage-content.ts"),
      "utf8",
    );

    expect(contentSource).toContain('{ href: "/dashboard", label: "Dashboard" }');
    expect(contentSource).toContain('title: "Our Church Ministry"');
    expect(contentSource).toContain('description: "Fellowship with us at any our branches nationwide"');
    expect(contentSource).toContain('mobileDescription: "Fellowship with us at any our branches nationwide"');
  });

  test("uses the dedicated church logo asset for the church pathway card header", () => {
    const contentSource = readFileSync(
      join(process.cwd(), "lib", "site-homepage-content.ts"),
      "utf8",
    );
    const cardSource = readFileSync(
      join(process.cwd(), "components", "home", "homepage-pathway-card.tsx"),
      "utf8",
    );

    expect(contentSource).toContain(
      'headerImageSrc: "/site/home/assets/church-pathway/church-logo-card.png"',
    );
    expect(contentSource).toContain('headerImageClassName: "object-contain"');
    expect(contentSource).toContain('headerClassName: "bg-[#15349B]"');
    expect(cardSource).toContain("headerImageClassName ?? \"object-cover\"");
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

  test("uses repo-backed Instagram reel cards for the curated social section", () => {
    const socialSource = readFileSync(
      join(process.cwd(), "components", "home", "homepage-social-section.tsx"),
      "utf8",
    );
    const viewSource = readFileSync(
      join(process.cwd(), "components", "home", "homepage-view.tsx"),
      "utf8",
    );
    const contentSource = readFileSync(
      join(process.cwd(), "lib", "site-homepage-content.ts"),
      "utf8",
    );

    expect(socialSource).toContain("HomepageSocialSection({ posts }");
    expect(socialSource).toContain("site-social-post-title");
    expect(socialSource).toContain("@pleros_org");
    expect(socialSource).not.toContain("useEffect");
    expect(socialSource).not.toContain('fetch("/api/social/instagram"');
    expect(socialSource).not.toContain("<iframe");
    expect(socialSource).not.toContain("SafeInstagramEmbed");
    expect(socialSource).not.toContain("react-social-media-embed");
    expect(viewSource).toContain("homeInstagramReels");
    expect(viewSource).toContain("<HomepageSocialSection posts={homeInstagramReels} />");
    expect(viewSource).not.toContain("getLatestInstagramPosts");
    expect(contentSource).toContain('export const homeInstagramProfileUrl = "https://instagram.com/pleros_org";');
    expect(contentSource).toContain("https://www.instagram.com/reel/DWimLXEDHSG/");
    expect(contentSource).toContain("https://www.instagram.com/reel/DWidB0TDPVn/");
    expect(contentSource).toContain("https://www.instagram.com/reel/DWhAJEaDCoW/");
    expect(contentSource).toContain("https://www.instagram.com/reel/DWgEDJADEzX/");
    expect(contentSource).toContain("https://www.instagram.com/reel/DWf6X8-jCU-/");
    expect(viewSource).not.toContain("getInstagramReelPreviews");
  });

  test("uses a full-width public page shell so desktop nav is not clipped", () => {
    const shellSource = readFileSync(
      join(process.cwd(), "components", "home", "public-site-page-shell.tsx"),
      "utf8",
    );
    const contactSource = readFileSync(
      join(process.cwd(), "components", "home", "contact-page-view.tsx"),
      "utf8",
    );
    const librarySource = readFileSync(
      join(process.cwd(), "app", "(site)", "library", "page.tsx"),
      "utf8",
    );

    expect(shellSource).toContain("max-w-none");
    expect(shellSource).toContain("md:px-0");
    expect(shellSource).not.toContain("md:px-6");
    expect(contactSource).toContain("PublicSitePageShell");
    expect(contactSource).not.toContain("max-w-[36.1875rem]");
    expect(librarySource).toContain("PublicSitePageShell");
  });

  test("defines public site shell tokens and bar utilities for desktop expansion", () => {
    const globalsSource = readFileSync(join(process.cwd(), "app", "globals.css"), "utf8");
    const navSource = readFileSync(
      join(process.cwd(), "components", "home", "homepage-nav.tsx"),
      "utf8",
    );
    const footerSource = readFileSync(
      join(process.cwd(), "components", "home", "homepage-footer.tsx"),
      "utf8",
    );
    const contentSource = readFileSync(
      join(process.cwd(), "lib", "site-homepage-content.ts"),
      "utf8",
    );

    expect(globalsSource).toContain("--site-mobile-max: 36.1875rem");
    expect(globalsSource).toContain("--site-shell-padding-x-md: 1.5rem");
    expect(globalsSource).toContain("--site-shell-padding-x-lg: 2.5rem");
    expect(globalsSource).toContain(".site-font-theme .site-shell-bar-inner");
    expect(globalsSource).toContain("min-width: 48rem");
    expect(globalsSource).toContain(".site-font-theme .site-shell-page");
    expect(globalsSource).toContain(".site-font-theme .site-footer-link");
    expect(navSource).toContain("site-shell-bar-inner");
    expect(footerSource).toContain("site-shell-bar-inner");
    expect(footerSource).toContain("homeFooterNavGroups");
    expect(footerSource).toContain("FooterNavGroup");
    expect(footerSource).toContain("xl:grid-cols-3");
    expect(contentSource).toContain('label: "Your Dashboard"');
    expect(footerSource).toContain("site-footer-copy");
    expect(footerSource).toContain("{link.label}");
    expect(contentSource).toContain('label: "Find Answers"');
    expect(globalsSource).toContain("font-size: 0.875rem");
  });

  test("shows a horizontal desktop nav and keeps the mobile sheet menu below lg", () => {
    const navSource = readFileSync(
      join(process.cwd(), "components", "home", "homepage-nav.tsx"),
      "utf8",
    );
    const contentSource = readFileSync(
      join(process.cwd(), "lib", "site-homepage-content.ts"),
      "utf8",
    );

    expect(navSource).toContain('aria-label="Main"');
    expect(navSource).toContain("site-desktop-nav-link");
    expect(navSource).toContain("HomepageNavDropdown");
    expect(navSource).toContain("homeDesktopNavGroups");
    expect(navSource).toContain("homeDesktopNavStandaloneLinks");
    expect(navSource).toContain("hidden min-w-0 flex-1 items-center justify-end gap-0.5 lg:flex");
    expect(navSource).toContain('<div className="lg:hidden">');
    expect(navSource).toContain("site-shell-bar-inner");
    expect(contentSource).toContain("desktopLabel?: string");
    expect(contentSource).toContain('label: "Resources"');
    expect(contentSource).toContain('label: "Pathways"');
    expect(contentSource).toContain('desktopLabel: "About us"');
  });

  test("styles desktop nav dropdowns as stacked menu lists", () => {
    const dropdownSource = readFileSync(
      join(process.cwd(), "components", "home", "homepage-nav-dropdown.tsx"),
      "utf8",
    );
    const globalsSource = readFileSync(
      join(process.cwd(), "app", "globals.css"),
      "utf8",
    );

    expect(dropdownSource).toContain('className="site-desktop-nav-menu');
    expect(dropdownSource).toContain("w-[15rem]");
    expect(dropdownSource).toContain("grid gap-0.5");
    expect(dropdownSource).toContain('className="site-desktop-nav-menu-link"');
    expect(globalsSource).toMatch(/^\s*\.site-desktop-nav-menu\s*\{/m);
    expect(globalsSource).toMatch(/^\s*\.site-desktop-nav-menu-link\s*\{/m);
    expect(globalsSource).toContain("width: 100%");
    expect(globalsSource).toContain("text-align: left");
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
    expect(navSource).toContain("inline-flex h-9 w-9 items-center justify-center text-white transition-opacity duration-150 hover:opacity-80 md:h-10 md:w-10");
    expect(navSource).toContain("border-b border-white/10 py-3 font-medium text-white/94");
    expect(globalsSource).toContain(".site-font-theme .site-mobile-menu-title");
    expect(globalsSource).toContain(".site-font-theme .site-mobile-menu-link");
    expect(globalsSource).toContain('font-family: var(--font-sen), "Sen", var(--font-heading) !important;');
  });

  test("wires a homepage-only free gift drawer as bottom sheet on mobile and centered modal on desktop", () => {
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
    expect(drawerSource).toContain("md:top-1/2");
    expect(drawerSource).toContain("md:left-1/2");
    expect(drawerSource).toContain("md:data-open:-translate-x-1/2");
    expect(drawerSource).toContain("md:data-open:-translate-y-1/2");
    expect(drawerSource).toContain("Get your free welcome pack");
    expect(drawerSource).toContain("The first resources you need to begin your Pleros journey");
    expect(drawerSource).toContain('placeholder="Email address"');
    expect(drawerSource).toContain("access welcome pack");
    expect(drawerSource).toContain("rounded-t-[var(--radius-xl)]");
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
