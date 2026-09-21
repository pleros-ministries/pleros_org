import { describe, expect, test } from "vitest";

import {
  DEFAULT_LEARNING_PROGRESS_SHARE_TEMPLATE,
  LEARNING_PROGRESS_SHARE_TEMPLATES,
  getLearningProgressShareInitials,
  isLearningProgressShareTemplate,
} from "./learning-progress-share";

describe("isLearningProgressShareTemplate", () => {
  test("accepts every declared template id", () => {
    for (const template of LEARNING_PROGRESS_SHARE_TEMPLATES) {
      expect(isLearningProgressShareTemplate(template.id)).toBe(true);
    }
  });

  test("rejects unknown or missing values", () => {
    expect(isLearningProgressShareTemplate("neon")).toBe(false);
    expect(isLearningProgressShareTemplate(undefined)).toBe(false);
    expect(isLearningProgressShareTemplate(null)).toBe(false);
  });

  test("default template is a valid template id", () => {
    expect(isLearningProgressShareTemplate(DEFAULT_LEARNING_PROGRESS_SHARE_TEMPLATE)).toBe(
      true,
    );
  });
});

describe("getLearningProgressShareInitials", () => {
  test("takes the first letter of the first and last name", () => {
    expect(getLearningProgressShareInitials("Olamide Olutekunbi")).toBe("OO");
  });

  test("handles a single name", () => {
    expect(getLearningProgressShareInitials("Olamide")).toBe("O");
  });

  test("ignores extra whitespace", () => {
    expect(getLearningProgressShareInitials("  Ada   Lovelace  ")).toBe("AL");
  });

  test("returns an empty string for blank input", () => {
    expect(getLearningProgressShareInitials("   ")).toBe("");
  });
});
