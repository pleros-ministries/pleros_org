"use client";

import { useQuery } from "@tanstack/react-query";

import { getAdminReviewData } from "@/app/admin/_actions/read-actions";
import { PageHeader } from "@/components/ppc/page-header";
import { ReviewQueueClient } from "@/components/ppc/review-queue-client";
import { ADMIN_QUERY_KEYS } from "@/lib/admin-query";

export function AdminReviewPageClient() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ADMIN_QUERY_KEYS.review,
    queryFn: getAdminReviewData,
  });

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Review queue"
        description={
          isLoading ? "Loading submissions" : `${data?.submissions.length ?? 0} total submissions`
        }
      />

      {isError ? (
        <div className="rounded-sm border border-rose-200 bg-rose-50 px-4 py-10 text-sm text-rose-700">
          Review submissions could not be loaded. Try again shortly.
        </div>
      ) : isLoading ? (
        <div className="grid gap-3" aria-busy="true" aria-label="Loading review submissions">
          <div className="h-10 animate-pulse rounded-sm bg-zinc-100" />
          <div className="h-96 animate-pulse rounded-sm border border-zinc-200 bg-white" />
        </div>
      ) : data ? (
        <ReviewQueueClient {...data} />
      ) : null}
    </div>
  );
}
