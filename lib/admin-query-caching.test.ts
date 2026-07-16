import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, test } from "vitest";

const schoolOfPurposePageSource = readFileSync(
  join(
    process.cwd(),
    "app",
    "admin",
    "(app)",
    "(admin-only)",
    "school-of-purpose",
    "page.tsx",
  ),
  "utf8",
);

const registrantsPageSource = readFileSync(
  join(process.cwd(), "app", "admin", "(app)", "students", "page.tsx"),
  "utf8",
);

const platformPageSource = readFileSync(
  join(
    process.cwd(),
    "app",
    "admin",
    "(app)",
    "(admin-only)",
    "platform",
    "page.tsx",
  ),
  "utf8",
);

const qaPageSource = readFileSync(
  join(process.cwd(), "app", "admin", "(app)", "qa", "page.tsx"),
  "utf8",
);

const reviewPageSource = readFileSync(
  join(process.cwd(), "app", "admin", "(app)", "review", "page.tsx"),
  "utf8",
);

const staffPageSource = readFileSync(
  join(
    process.cwd(),
    "app",
    "admin",
    "(app)",
    "(super-admin-only)",
    "staff",
    "page.tsx",
  ),
  "utf8",
);

const queryProviderSource = readFileSync(
  join(process.cwd(), "components", "query-provider.tsx"),
  "utf8",
);

const shellSource = readFileSync(
  join(process.cwd(), "components", "ppc", "ppc-shell.tsx"),
  "utf8",
);

describe("admin read-model caching", () => {
  test("renders the School of Purpose page through the client query cache", () => {
    expect(schoolOfPurposePageSource).toContain("AdminSchoolOfPurposeClient");
    expect(schoolOfPurposePageSource).not.toContain(
      "getSchoolOfPurposeWaitlistEntries",
    );
  });

  test("renders the Registrants page through the client query cache", () => {
    expect(registrantsPageSource).toContain("AdminRegistrantListCached");
    expect(registrantsPageSource).not.toContain("getAdminRegistrantList");
  });

  test("renders the Platform page through the client query cache", () => {
    expect(platformPageSource).toContain("AdminPlatformClient");
    expect(platformPageSource).not.toContain("getStudentPlatformList");
  });

  test("renders the Q&A page through the client query cache", () => {
    expect(qaPageSource).toContain("AdminQaPageClient");
    expect(qaPageSource).not.toContain("getAllThreads");
  });

  test("renders the Review page through the client query cache", () => {
    expect(reviewPageSource).toContain("AdminReviewPageClient");
    expect(reviewPageSource).not.toContain("getReviewQueue");
  });

  test("renders the Staff page through the client query cache", () => {
    expect(staffPageSource).toContain("AdminStaffPageClient");
    expect(staffPageSource).not.toContain("listStaffUsers");
  });

  test("keeps an isolated browser cache when the admin shell remounts", () => {
    expect(queryProviderSource).toContain("queryClientsByUserId");
    expect(queryProviderSource).toContain("getQueryClient(userId)");
    expect(queryProviderSource).toContain('fetch("/api/auth/get-session"');
  });

  test("renders cached admin data while an App Router transition is pending", () => {
    expect(shellSource).toContain("PendingAdminRoute");
    expect(shellSource).toContain("AdminPlatformPreview");
    expect(shellSource).toContain("<PendingAdminRoute pathname={pendingPathname} />");
  });
});
