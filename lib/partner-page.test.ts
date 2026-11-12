import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";

describe("partner page", () => {
  test("uses a dedicated public route and follows the dashboard Partner tab from giving down", () => {
    const routePath = join(process.cwd(), "app", "(site)", "partner", "page.tsx");
    const viewPath = join(
      process.cwd(),
      "components",
      "home",
      "partner-page-view.tsx",
    );
    const contentPath = join(process.cwd(), "lib", "partner-page-content.ts");

    expect(existsSync(routePath)).toBe(true);
    expect(existsSync(viewPath)).toBe(true);
    expect(existsSync(contentPath)).toBe(true);

    const routeSource = readFileSync(routePath, "utf8");
    const viewSource = readFileSync(viewPath, "utf8");
    const contentSource = readFileSync(contentPath, "utf8");

    const sectionsSource = readFileSync(
      join(process.cwd(), "components", "home", "partner-giving-sections.tsx"),
      "utf8",
    );

    expect(routeSource).toContain("PartnerPageView");
    expect(viewSource).toContain("<PartnerGivingSections />");
    // From giving down it follows the dashboard Partner tab (user, 12 November).
    const order = [
      "Give now</button>",
      "<h2 className={styles.heading}>Ways to give</h2>",
      "<h2 className={styles.heading}>Report giving</h2>",
      "<h2 className={styles.heading}>Why partner with Pleros</h2>",
      "<h2 className={styles.heading}>{partnerImpactTitle}</h2>",
    ].map((marker) => sectionsSource.indexOf(marker));
    expect(order.every((index) => index >= 0)).toBe(true);
    expect([...order].sort((x, y) => x - y)).toEqual(order);
    expect(sectionsSource).toContain('id="partner"');
    expect(sectionsSource).toContain('href="/dashboard/partner"');
    expect(sectionsSource).toContain("PaystackDonateForm");
    expect(contentSource).toContain('partnerImpactTitle = "What your gift does"');
    expect(contentSource).toContain("Advance the Gospel");
    expect(contentSource).toContain("Raise Disciples");
    expect(contentSource).toContain("Extend the Influence of Truth");
    expect(contentSource).not.toContain("Transform Communities");
    expect(contentSource).not.toContain("Leadership Training");
    expect(contentSource).toContain("partnerWhatsappHref");
    expect(viewSource).not.toContain("become-a-partner");
    expect(contentSource).not.toContain("Become a partner today");
    expect(contentSource).toContain("partnerBankAccount");
    expect(contentSource).toContain("Providus Bank");
    expect(contentSource).toContain("PLEROS MINISTRIES AND MISSIONS");
    expect(contentSource).toContain("1310000564");
    expect(sectionsSource).toContain("partnerBankAccount");
    expect(sectionsSource).toContain("CopyToClipboardButton");
  });
});
