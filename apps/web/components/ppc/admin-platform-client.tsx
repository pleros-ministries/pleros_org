"use client";

import { useQuery } from "@tanstack/react-query";

import { getAdminPlatformData } from "@/app/admin/_actions/read-actions";
import { AdminControlsClient } from "@/components/ppc/admin-controls-client";
import { PageHeader } from "@/components/ppc/page-header";
import { ADMIN_QUERY_KEYS } from "@/lib/admin-query";

export function AdminPlatformClient() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ADMIN_QUERY_KEYS.platform,
    queryFn: getAdminPlatformData,
  });

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Platform"
        description="Student overrides, reviewer assignments, and platform stats"
      />

      {isError ? (
        <div className="rounded-sm border border-rose-200 bg-rose-50 px-4 py-10 text-sm text-rose-700">
          Platform controls could not be loaded. Try again shortly.
        </div>
      ) : isLoading ? (
        <div className="grid gap-3" aria-busy="true" aria-label="Loading platform controls">
          <div className="grid grid-cols-3 gap-2">
            <div className="h-16 animate-pulse rounded-sm bg-zinc-100" />
            <div className="h-16 animate-pulse rounded-sm bg-zinc-100" />
            <div className="h-16 animate-pulse rounded-sm bg-zinc-100" />
          </div>
          <div className="h-72 animate-pulse rounded-sm border border-zinc-200 bg-white" />
        </div>
      ) : data ? (
        <AdminControlsClient {...data} />
      ) : null}
    </div>
  );
}
