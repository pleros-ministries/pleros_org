import { describe, expect, test } from "vitest";

import {
  PPC_SIDEBAR_STORAGE_KEY,
  parseSidebarCollapsedState,
  serializeSidebarCollapsedState,
} from "./ppc-shell-state";

describe("ppc shell state", () => {
  test("storage key stays stable", () => {
    expect(PPC_SIDEBAR_STORAGE_KEY).toBe("ppc.sidebar.collapsed");
  });

  test("parse handles known serialized values", () => {
    expect(parseSidebarCollapsedState("1")).toBe(true);
    expect(parseSidebarCollapsedState("0")).toBe(false);
  });

  test("parse falls back safely for unknown values", () => {
    expect(parseSidebarCollapsedState(null)).toBe(false);
    expect(parseSidebarCollapsedState("unexpected")).toBe(false);
  });

  test("serialize maps boolean to compact storage", () => {
    expect(serializeSidebarCollapsedState(true)).toBe("1");
    expect(serializeSidebarCollapsedState(false)).toBe("0");
  });
});
