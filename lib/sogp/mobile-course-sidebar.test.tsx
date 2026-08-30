import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";

import { SogpMobileCourseTrigger } from "../../components/sogp/sogp-mobile-course-trigger";

test("renders an accessible mobile course-sidebar trigger", () => {
  const html = renderToStaticMarkup(
    <SogpMobileCourseTrigger data-forwarded="yes" />,
  );

  expect(html).toContain("Course menu");
  expect(html).toContain('aria-label="Open course menu"');
  expect(html).toContain('data-forwarded="yes"');
  expect(html).toContain("lg:hidden");
});
