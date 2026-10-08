"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import type { CommunityActionResult } from "@/lib/community/errors";

/**
 * Runs a server action from the report area: shows an expected failure as a
 * message, refreshes the page on success, and lets the caller update the
 * screen first so the change shows at once.
 */
export function useReportAction() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function run<T extends object>(
    action: () => Promise<CommunityActionResult<T>>,
    steps: {
      optimistic?: () => void;
      onDone?: (result: { ok: true } & T) => void;
      /** Skip the refresh, for callers that navigate instead. */
      refresh?: boolean;
    } = {},
  ) {
    setError(null);
    startTransition(async () => {
      steps.optimistic?.();
      try {
        const result = await action();
        if (!result.ok) {
          setError(result.error);
          return;
        }
        steps.onDone?.(result);
        if (steps.refresh !== false) router.refresh();
      } catch {
        setError("Something went wrong. Try again.");
      }
    });
  }

  return { run, pending, error, clearError: () => setError(null) };
}
