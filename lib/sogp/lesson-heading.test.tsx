import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";

import { SogpLessonHeading } from "../../components/sogp/sogp-lesson-heading";

test("renders lesson metadata as muted supporting text", () => {
  const html = renderToStaticMarkup(
    <SogpLessonHeading
      metadata="Level 2 · Track 4 · 2026-09-17"
      title="Biblical Origin and Ontology"
    />,
  );

  expect(html).toContain("text-[var(--color-text-muted)]");
  expect(html).not.toContain("text-[var(--color-brand-blue)]");
  expect(html).toContain("Biblical Origin and Ontology");
});
