import { describe, expect, test } from "vitest";

import {
  buildPreSogpPostPath,
  buildPreSogpPostUrl,
  buildPreSogpShareIntentUrl,
  buildPreSogpShareMessage,
  forwardUtmParams,
} from "./share";

describe("buildPreSogpPostPath", () => {
  test("keys the path by date and tags the platform + day campaign", () => {
    expect(buildPreSogpPostPath("2026-09-15", "whatsapp")).toBe(
      "/sogp/prepare/2026-09-15?utm_source=whatsapp&utm_medium=share&utm_campaign=pre-sogp-2026-09-15",
    );
  });

  test("copy and native shares are still attributed", () => {
    expect(buildPreSogpPostPath("2026-09-15", "copy")).toContain(
      "utm_source=copy",
    );
    expect(buildPreSogpPostPath("2026-09-15", "native")).toContain(
      "utm_source=native",
    );
  });
});

describe("buildPreSogpPostUrl", () => {
  test("prefixes the resolved site origin", () => {
    expect(
      buildPreSogpPostUrl({
        siteUrl: "https://pleros.org",
        dateKey: "2026-09-15",
        platform: "facebook",
      }),
    ).toBe(
      "https://pleros.org/sogp/prepare/2026-09-15?utm_source=facebook&utm_medium=share&utm_campaign=pre-sogp-2026-09-15",
    );
  });
});

describe("buildPreSogpShareMessage", () => {
  test("leads with the day label and title, ends on the invite", () => {
    const message = buildPreSogpShareMessage({
      dayLabel: "Day 3",
      title: "Why you exist",
    });
    expect(message.startsWith("Day 3 of my Pre-SOGP journey: Why you exist.")).toBe(
      true,
    );
    expect(message.endsWith("join the next cohort free here:")).toBe(true);
  });
});

describe("buildPreSogpShareIntentUrl", () => {
  const postUrl =
    "https://pleros.org/sogp/prepare/2026-09-15?utm_source=whatsapp&utm_medium=share&utm_campaign=pre-sogp-2026-09-15";
  const message = "Day 3 of my Pre-SOGP journey: Why you exist.";

  test("whatsapp carries message + url in a single text param", () => {
    const href = buildPreSogpShareIntentUrl({
      platform: "whatsapp",
      postUrl,
      message,
    });
    expect(href.startsWith("https://wa.me/?text=")).toBe(true);
    expect(decodeURIComponent(href)).toContain(message);
    expect(decodeURIComponent(href)).toContain(postUrl);
  });

  test("facebook is url-only", () => {
    const href = buildPreSogpShareIntentUrl({
      platform: "facebook",
      postUrl,
      message,
    });
    expect(href).toBe(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(postUrl)}`,
    );
  });

  test("x and telegram split url and text", () => {
    const x = buildPreSogpShareIntentUrl({ platform: "x", postUrl, message });
    expect(x).toBe(
      `https://twitter.com/intent/tweet?url=${encodeURIComponent(postUrl)}&text=${encodeURIComponent(message)}`,
    );
    const tg = buildPreSogpShareIntentUrl({
      platform: "telegram",
      postUrl,
      message,
    });
    expect(tg).toBe(
      `https://t.me/share/url?url=${encodeURIComponent(postUrl)}&text=${encodeURIComponent(message)}`,
    );
  });
});

describe("forwardUtmParams", () => {
  test("keeps only the five utm keys, drops everything else", () => {
    expect(
      forwardUtmParams({
        utm_source: "whatsapp",
        utm_medium: "share",
        utm_campaign: "pre-sogp-2026-09-15",
        date: "2026-09-15",
        foo: "bar",
      }),
    ).toBe(
      "utm_source=whatsapp&utm_medium=share&utm_campaign=pre-sogp-2026-09-15",
    );
  });

  test("ignores array values, empty strings, and overly long values", () => {
    expect(
      forwardUtmParams({
        utm_source: ["a", "b"],
        utm_medium: "",
        utm_campaign: "x".repeat(201),
      }),
    ).toBe("");
  });
});
