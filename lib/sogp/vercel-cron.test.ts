import { readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "vitest";

test("uses one Hobby-compatible daily SOGP cron", () => {
  const config = JSON.parse(
    readFileSync(join(process.cwd(), "vercel.json"), "utf8"),
  ) as { crons?: Array<{ path: string; schedule: string }> };

  expect(config.crons).toEqual([
    {
      path: "/api/cron/sogp-reminders",
      schedule: "20 4 * * *",
    },
  ]);
});

test("caches the versioned self-hosted SOGP video assets", () => {
  const config = JSON.parse(
    readFileSync(join(process.cwd(), "vercel.json"), "utf8"),
  ) as {
    headers?: Array<{
      source: string;
      headers: Array<{ key: string; value: string }>;
    }>;
  };

  expect(config.headers).toEqual([
    {
      source: "/site/sogp/sogp-welcome-WaXgk9zqi78.mp4",
      headers: [
        {
          key: "Cache-Control",
          value: "public, max-age=31536000, immutable",
        },
        {
          key: "Vercel-CDN-Cache-Control",
          value: "public, max-age=31536000, immutable",
        },
      ],
    },
    {
      source: "/site/sogp/sogp-welcome-WaXgk9zqi78.jpg",
      headers: [
        {
          key: "Cache-Control",
          value: "public, max-age=31536000, immutable",
        },
        {
          key: "Vercel-CDN-Cache-Control",
          value: "public, max-age=31536000, immutable",
        },
      ],
    },
    {
      source: "/site/sogp/sogp-welcome-square-20260831.mp4",
      headers: [
        {
          key: "Cache-Control",
          value: "public, max-age=31536000, immutable",
        },
        {
          key: "Vercel-CDN-Cache-Control",
          value: "public, max-age=31536000, immutable",
        },
      ],
    },
    {
      source: "/site/sogp/sogp-welcome-square-20260831.jpg",
      headers: [
        {
          key: "Cache-Control",
          value: "public, max-age=31536000, immutable",
        },
        {
          key: "Vercel-CDN-Cache-Control",
          value: "public, max-age=31536000, immutable",
        },
      ],
    },
  ]);
});
