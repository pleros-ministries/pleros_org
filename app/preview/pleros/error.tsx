"use client";

import { useEffect } from "react";
import { TriangleAlertIcon } from "lucide-react";

import { EmptyState, buttonPrimary } from "@/components/preview/pleros/ui";

export default function DemoError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <EmptyState
      icon={<TriangleAlertIcon className="size-5" aria-hidden />}
      title="This part of the demo did not load"
      action={
        <button type="button" onClick={() => retry()} className={buttonPrimary}>
          Try again
        </button>
      }
    >
      Nothing was lost: the demo&apos;s changes live in this browser tab. If it keeps happening, use
      Reset demo from the person switcher.
    </EmptyState>
  );
}
