import { expect, test } from "vitest";

test("the install prompt store loads and stays inert without a browser", async () => {
  // Server rendering evaluates this module too, so importing it must not throw.
  const store = await import("./install-prompt-store");

  expect(store.getServerInstallPromptStatus()).toBe("pending");
  expect(typeof window).toBe("undefined");
  expect(store.getInstallPromptStatus()).toBe("pending");
});

test("subscribing returns an unsubscribe function", async () => {
  const { subscribeToInstallPrompt } = await import("./install-prompt-store");

  const unsubscribe = subscribeToInstallPrompt(() => {});

  expect(typeof unsubscribe).toBe("function");
  expect(() => unsubscribe()).not.toThrow();
});

test("prompting without a held install event reports unavailable", async () => {
  const { promptInstall } = await import("./install-prompt-store");

  await expect(promptInstall()).resolves.toBe("unavailable");
});
