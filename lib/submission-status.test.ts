import { expect, test } from "vitest";

import { isWrittenSubmissionApproved } from "./submission-status";

test("only approved submissions satisfy written completion", () => {
  expect(isWrittenSubmissionApproved("draft")).toBe(false);
  expect(isWrittenSubmissionApproved("submitted")).toBe(false);
  expect(isWrittenSubmissionApproved("needs_revision")).toBe(false);
  expect(isWrittenSubmissionApproved("approved")).toBe(true);
});
