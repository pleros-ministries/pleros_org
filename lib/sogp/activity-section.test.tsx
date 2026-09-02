import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";

import { SogpActivitySection } from "../../components/sogp/sogp-activity-section";

test("renders a labelled card with a divided header", () => {
  const html = renderToStaticMarkup(
    <SogpActivitySection
      title="Teaching"
      description="Listen at your pace."
      icon={<span>Icon</span>}
    >
      <p>Activity content</p>
    </SogpActivitySection>,
  );

  expect(html).toContain("Teaching");
  expect(html).toContain("Listen at your pace.");
  expect(html).toContain("border-b");
  expect(html).toContain("Activity content");
});

test("renders an optional header action when supplied", () => {
  const html = renderToStaticMarkup(
    <SogpActivitySection
      title="Preparation lesson 16"
      icon={<span>Icon</span>}
      action={<button type="button">Header action</button>}
    >
      <p>Activity content</p>
    </SogpActivitySection>,
  );

  expect(html).toContain("Preparation lesson 16");
  expect(html).toContain("Header action");
});
