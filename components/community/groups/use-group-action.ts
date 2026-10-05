"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import type { CommunityActionResult } from "@/lib/community/errors";

/**
 * Runs a group server action, surfaces its error copy, and refreshes the page
 * so membership, counts and permissions come back from the server.
 */
export function useGroupAction() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function run(
    action: () => Promise<CommunityActionResult>,
    onDone?: () => void,
  ) {
    setError(null);
    startTransition(async () => {
      try {
        const result = await action();
        if (!result.ok) {
          setError(result.error);
          return;
        }
        onDone?.();
        router.refresh();
      } catch {
        setError("Something went wrong. Try again.");
      }
    });
  }

  return { run, pending, error };
}
