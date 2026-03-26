import { describe, expect, test } from "vitest";

import {
  siteNavItems,
  styleDemoSections,
  themeSurfaceItems,
} from "./site-foundations";

describe("site foundations", () => {
  test("exposes the marketing shell navigation entries", () => {
    expect(siteNavItems).toEqual([
      { href: "/", label: "Home" },
      { href: "/style-demo", label: "Style demo" },
      { href: "/ppc", label: "PPC login" },
    ]);
  });

  test("keeps style demo anchors unique and ordered", () => {
    expect(styleDemoSections.map((section) => section.id)).toEqual([
      "typography",
      "buttons",
      "inputs",
      "surfaces",
      "radii",
    ]);
  });

  test("covers the three pathway themes for branded surfaces", () => {
    expect(
      themeSurfaceItems.map(({ id, label, tone, badgeVariant }) => ({
        id,
        label,
        tone,
        badgeVariant,
      })),
    ).toEqual([
      {
        id: "questions",
        label: "Questions",
        tone: "questions",
        badgeVariant: "questions",
      },
      {
        id: "purpose",
        label: "Purpose",
        tone: "purpose",
        badgeVariant: "purpose",
      },
      {
        id: "fulfil",
        label: "Fulfil",
        tone: "fulfil",
        badgeVariant: "fulfil",
      },
    ]);
  });
});
