import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";

import { SogpLessonHeading } from "../../components/sogp/sogp-lesson-heading";

test("renders a compact level and track indicator instead of a lesson title", () => {
  const html = renderToStaticMarkup(
    <SogpLessonHeading
      eyebrow="Current level"
      title="Level 2"
      detail="Track 4 of 6"
    />,
  );

  expect(html).toContain("text-[var(--color-text-muted)]");
  expect(html).not.toContain("text-[var(--color-brand-blue)]");
  expect(html).toContain("Current level");
  expect(html).toContain("Level 2");
  expect(html).toContain("Track 4 of 6");
  expect(html).not.toContain("Biblical Origin and Ontology");
});
