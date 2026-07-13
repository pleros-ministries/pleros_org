"use client";

import { useQuery } from "@tanstack/react-query";

import { getAdminRegistrants } from "@/app/admin/_actions/read-actions";
import { PageHeader } from "@/components/ppc/page-header";
import { RegistrantListClient } from "@/components/ppc/registrant-list-client";
import { ADMIN_QUERY_KEYS } from "@/lib/admin-query";

export function AdminRegistrantListCached() {
  const { data: registrants, isLoading, isError } = useQuery({
    queryKey: ADMIN_QUERY_KEYS.registrants,
    queryFn: getAdminRegistrants,
  });
  const ppcAccounts = registrants?.filter(
    (registrant) => registrant.accountStatus === "ppc_account",
  ).length ?? 0;
  const welcomeOnly = (registrants?.length ?? 0) - ppcAccounts;

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Registrants"
        description={
          isLoading
            ? "Loading registrants"
            : `${registrants?.length ?? 0} total · ${ppcAccounts} PPC accounts · ${welcomeOnly} welcome only`
        }
      />

      {isError ? (
        <div className="rounded-sm border border-rose-200 bg-rose-50 px-4 py-10 text-sm text-rose-700">
          Registrants could not be loaded. Try again shortly.
        </div>
      ) : isLoading ? (
        <div className="grid gap-3" aria-busy="true" aria-label="Loading registrants">
          <div className="h-8 animate-pulse rounded-sm bg-zinc-100" />
          <div className="h-72 animate-pulse rounded-sm border border-zinc-200 bg-white" />
        </div>
      ) : (
        <RegistrantListClient registrants={registrants ?? []} basePath="/admin" />
      )}
    </div>
  );
}
