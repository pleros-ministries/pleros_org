import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";

import { SogpContextSidebar } from "../../components/sogp/sogp-context-sidebar";
import { sogpPreviewData } from "./preview-fixtures";

test("keeps learner progress and review context without a community promotion", () => {
  // The share dialog uses useMutation, which needs a QueryClient above it.
  const html = renderToStaticMarkup(
    <QueryClientProvider client={new QueryClient()}>
      <SogpContextSidebar data={sogpPreviewData} />
    </QueryClientProvider>,
  );

  expect(html).toContain("Course progress");
  expect(html).toContain("Next required review");
  expect(html).not.toContain("Your SOGP community");
  expect(html).not.toContain("Open Telegram");
});
