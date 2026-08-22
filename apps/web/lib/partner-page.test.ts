import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";

describe("partner page", () => {
  test("uses a dedicated public route and restores the legacy partnership sections", () => {
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

    expect(routeSource).toContain("PartnerPageView");
    expect(viewSource).toContain("Why partner with Pleros");
    expect(viewSource).toContain("What your partnership makes possible");
    expect(viewSource).toContain("grid-cols-1");
    expect(viewSource).toContain("md:grid-cols-2");
    expect(contentSource).toContain("Advance the Gospel");
    expect(contentSource).toContain("Raise Disciples");
    expect(contentSource).toContain("Extend the Influence of Truth");
    expect(contentSource).not.toContain("Transform Communities");
    expect(contentSource).not.toContain("Leadership Training");
    expect(viewSource).toContain("bg-[#10229f]");
    expect(viewSource).not.toContain("bg-white/8");
    expect(viewSource).toContain(
      "text-[0.6875rem] font-semibold uppercase tracking-[0.22em]",
    );
    expect(viewSource).toContain("md:text-[0.8125rem]");
    expect(viewSource).toContain(
      "text-[1rem] leading-[0.95] tracking-[-0.04em]",
    );
    expect(contentSource).toContain("partnerWhatsappHref");
    expect(viewSource).not.toContain("become-a-partner");
    expect(contentSource).not.toContain("Become a partner today");
    expect(contentSource).toContain("partnerBankAccount");
    expect(contentSource).toContain("Providus Bank");
    expect(contentSource).toContain("PLEROS MINISTRIES AND MISSIONS");
    expect(contentSource).toContain("1310000564");
    expect(viewSource).toContain("partnerBankAccount");
    expect(viewSource).toContain("CopyToClipboardButton");
  });
});
