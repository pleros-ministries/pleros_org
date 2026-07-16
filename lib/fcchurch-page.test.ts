import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";

describe("fcchurch page", () => {
  test("uses a dedicated public route listing locations and an online-join invitation", () => {
    const routePath = join(process.cwd(), "app", "(site)", "fcchurch", "page.tsx");
    const viewPath = join(
      process.cwd(),
      "components",
      "home",
      "fcchurch-page-view.tsx",
    );
    const contentPath = join(process.cwd(), "lib", "fcchurch-page-content.ts");

    expect(existsSync(routePath)).toBe(true);
    expect(existsSync(viewPath)).toBe(true);
    expect(existsSync(contentPath)).toBe(true);

    const routeSource = readFileSync(routePath, "utf8");
    const viewSource = readFileSync(viewPath, "utf8");
    const contentSource = readFileSync(contentPath, "utf8");

    expect(routeSource).toContain("FcchurchPageView");

    expect(viewSource).toContain("fcchurchLocations");
    expect(viewSource).toContain("fcchurchOnlineSection");
    expect(viewSource).toContain("Join us in person");
    expect(viewSource).toContain("HomepageCommunitySection");
    expect(viewSource).toContain("HomepageFooter");

    expect(contentSource).toContain("Fullness of Christ Church");
    expect(contentSource).toContain("[Venue name]");
    expect(contentSource).toContain("[Service day & time]");
    expect(contentSource).toContain("Join us online");
    expect(contentSource).toContain("https://www.youtube.com/@PlerosLive");
  });

  test("homepage church pathway card links to /fcchurch", () => {
    const contentSource = readFileSync(
      join(process.cwd(), "lib", "site-homepage-content.ts"),
      "utf8",
    );

    expect(contentSource).toContain('title: "Our Church Ministry"');

    const cardIndex = contentSource.indexOf('title: "Our Church Ministry"');
    const cardBlock = contentSource.slice(cardIndex, cardIndex + 300);

    expect(cardBlock).toContain('href: "/fcchurch"');
  });
});
