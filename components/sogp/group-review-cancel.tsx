"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cancelGroupReview } from "@/app/_actions/sogp-group-review-actions";
import { DashboardIcon } from "@/components/dashboard/v3/primitives";
import styles from "./group-reviews.module.css";

/** Lead-only cancel for reviews that have not started. Two taps; nothing confirmed can be removed. */
export function CancelReviewButton({ reviewId }: { reviewId: number }) {
  const [armed, setArmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startCancel] = useTransition();
  const router = useRouter();
  function cancel() {
    if (!armed) { setArmed(true); return; }
    startCancel(async () => {
      try {
        const result = await cancelGroupReview({ reviewId });
        if (!result.ok) { setError(result.error); setArmed(false); return; }
        router.refresh();
      } catch { setError("The review could not be cancelled. Try again."); setArmed(false); }
    });
  }
  return <>
    <button type="button" className={styles.rowLink} disabled={pending} onClick={cancel}>{armed ? "Tap again to cancel this review" : "Cancel review"}<DashboardIcon name="close" size={16} /></button>
    {error ? <p role="alert" className={styles.error}>{error}</p> : null}
  </>;
}
