import { renderToStaticMarkup } from "react-dom/server";
import { expect, test, vi } from "vitest";
import { OrientationSurveyView } from "@/components/dashboard/shared/orientation-survey";
import { SOGP_ORIENTATION_REASONS } from "@/lib/sogp/orientation-survey";
const callbacks = { onToggle: vi.fn(), onQuestionChange: vi.fn(), onSubmit: vi.fn() };
function render(reasons: string[], question: string, completed = false) {
  return renderToStaticMarkup(<OrientationSurveyView {...callbacks} completed={completed} reasons={reasons} question={question} telegramUrl="https://t.me/pleros_sogp" />);
}
test("requires three reasons and a question before continuing", () => {
  const reasons = SOGP_ORIENTATION_REASONS.slice(0, 3).map(reason => reason.value);
  for (const [selection, question] of [[reasons.slice(0, 2), "A question"], [reasons, "   "]] as [string[], string][]) {
    expect(render(selection, question)).toMatch(/<button[^>]*disabled=""/);
  }
  expect(render(reasons, "A question")).not.toMatch(/<button[^>]*disabled=""/);
});
test("completed survey exposes the handoff instead of resubmitting answers", () => {
  const html = render([], "", true);
  expect(html).toContain('href="https://t.me/pleros_sogp"');
  expect(html).not.toContain("<form");
});
