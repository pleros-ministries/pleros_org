import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";

import { SogpLevelTracker } from "../../components/sogp/sogp-level-tracker";
import { sogpPreviewData } from "./preview-fixtures";

test("keeps level tracking collapsed on mobile and visible in the desktop sidebar", () => {
  const html = renderToStaticMarkup(
    <SogpLevelTracker levels={sogpPreviewData.levels} />,
  );

  expect(html).toContain('aria-expanded="false"');
  expect(html).toMatch(/class="[^"]*\bhidden\b[^"]*\blg:grid\b/);
  expect(html.match(/Level [1-4]/g)).toHaveLength(4);
});

test("marks a level whose week certificate has been earned", () => {
  const html = renderToStaticMarkup(
    <SogpLevelTracker
      levels={sogpPreviewData.levels}
      certificates={sogpPreviewData.certificates.weeks}
    />,
  );

  expect(html.match(/Week certificate earned/g)).toHaveLength(1);
  expect(html.match(/Level [1-4]/g)).toHaveLength(4);
});
