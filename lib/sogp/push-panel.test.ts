import { readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "vitest";

test("offers a user-initiated SOGP Prayer Watch reminder subscription", () => {
  const panel = readFileSync(
    join(process.cwd(), "components", "sogp", "sogp-push-panel.tsx"),
    "utf8",
  );
  const hook = readFileSync(
    join(process.cwd(), "lib", "push", "use-push.ts"),
    "utf8",
  );
  expect(panel).toContain("Enable Prayer Watch reminders");
  expect(panel).toContain("onClick={subscribe}");
  expect(panel).not.toContain("Notification.requestPermission");
  expect(hook).toContain('/api/sogp/push/subscribe');
  expect(hook).not.toContain('/api/ppc/push/subscribe');
});
