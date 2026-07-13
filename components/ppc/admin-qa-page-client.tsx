"use client";

import { useQuery } from "@tanstack/react-query";

import { getAdminQaData } from "@/app/admin/_actions/read-actions";
import { PageHeader } from "@/components/ppc/page-header";
import { QaInboxClient } from "@/components/ppc/qa-inbox-client";
import { ADMIN_QUERY_KEYS } from "@/lib/admin-query";

export function AdminQaPageClient() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ADMIN_QUERY_KEYS.qa,
    queryFn: getAdminQaData,
  });

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Q&A inbox"
        description={isLoading ? "Loading threads" : `${data?.threads.length ?? 0} threads`}
      />

      {isError ? (
        <div className="rounded-sm border border-rose-200 bg-rose-50 px-4 py-10 text-sm text-rose-700">
          Q&amp;A threads could not be loaded. Try again shortly.
        </div>
      ) : isLoading ? (
        <div className="grid gap-3" aria-busy="true" aria-label="Loading Q&A threads">
          <div className="h-10 animate-pulse rounded-sm bg-zinc-100" />
          <div className="h-96 animate-pulse rounded-sm border border-zinc-200 bg-white" />
        </div>
      ) : data ? (
        <QaInboxClient {...data} />
      ) : null}
    </div>
  );
}
