import fs from "node:fs";
import path from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";

import { StatusBadge } from "@/components/ppc/status-badge";

describe("approved status pill contract", () => {
  test("dashboard pills use the newest rounded mint and plum treatment", () => {
    const css = fs.readFileSync(
      path.join(process.cwd(), "components/dashboard/v3/dashboard.module.css"),
      "utf8",
    );

    expect(css).toContain("--dashboard-status-radius: 999px");
    expect(css).toContain("--status-green-bg: #d8f7bd");
    expect(css).toContain("--status-green-text: #205e20");
    expect(css).toContain("--status-lilac-bg: #dec8fa");
    expect(css).toContain("--status-lilac-text: #56209c");
  });

  test("shared admin status badges use the same compact pill shape and palette", () => {
    const success = renderToStaticMarkup(<StatusBadge status="reported" variant="success" />);
    const violet = renderToStaticMarkup(<StatusBadge status="nil declared" variant="violet" />);

    expect(success).toContain("rounded-full");
    expect(success).toContain("bg-[var(--color-community-mint-soft)]");
    expect(success).toContain("text-[var(--color-community-mint-ink)]");
    expect(violet).toContain("bg-[var(--color-community-plum-soft)]");
    expect(violet).toContain("text-[var(--color-community-plum-ink)]");
  });
});
