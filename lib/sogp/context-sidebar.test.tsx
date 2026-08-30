import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";

import { SogpContextSidebar } from "../../components/sogp/sogp-context-sidebar";
import { sogpPreviewData } from "./preview-fixtures";

test("keeps learner progress and review context without a community promotion", () => {
  const html = renderToStaticMarkup(
    <SogpContextSidebar data={sogpPreviewData} />,
  );

  expect(html).toContain("Course progress");
  expect(html).toContain("Next required review");
  expect(html).not.toContain("Your SOGP community");
  expect(html).not.toContain("Open Telegram");
});
