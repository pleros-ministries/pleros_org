import { expect, test } from "vitest";

import { SOGP_PREPARATION_CONTENT } from "./preparation-content";

test("uses existing Pleros destinations in stable order", () => {
  expect(SOGP_PREPARATION_CONTENT.map((item) => item.id)).toEqual([
    "questions",
    "purpose",
    "discipleship",
  ]);
  expect(SOGP_PREPARATION_CONTENT.every((item) => item.href.startsWith("/"))).toBe(true);
});
