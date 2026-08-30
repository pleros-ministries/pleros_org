import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";

import { SogpActivitySection } from "../../components/sogp/sogp-activity-section";

test("renders an expanded activity disclosure with a divided header", () => {
  const html = renderToStaticMarkup(
    <SogpActivitySection
      title="Teaching"
      description="Listen at your pace."
      icon={<span>Icon</span>}
    >
      <p>Activity content</p>
    </SogpActivitySection>,
  );

  expect(html).toContain('aria-expanded="true"');
  expect(html).toContain("data-activity-header");
  expect(html).toContain("border-b");
  expect(html).toContain(" bg-[var(--color-surface-muted)] ");
  expect(html).not.toContain("grid size-8 shrink-0 place-items-center");
  expect(html).toContain("Activity content");
});
