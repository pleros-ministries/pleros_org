"use client";

import { useQuery } from "@tanstack/react-query";

import { getAdminSchoolOfPurposeWaitlist } from "@/app/admin/_actions/read-actions";
import { PageHeader } from "@/components/ppc/page-header";
import {
  ADMIN_QUERY_KEYS,
  type AdminSchoolOfPurposeWaitlistEntry,
} from "@/lib/admin-query";

function formatDate(value: string) {
  return value.replace("T", " ").slice(0, 16);
}

function WaitlistTable({ entries }: { entries: AdminSchoolOfPurposeWaitlistEntry[] }) {
  if (entries.length === 0) {
    return <div className="px-4 py-10 text-sm text-zinc-500">No waitlist signups yet.</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-zinc-100 text-left text-sm">
        <thead className="bg-zinc-50 text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500">
          <tr>
            <th className="px-4 py-3">Name</th>
            <th className="px-4 py-3">WhatsApp number</th>
            <th className="px-4 py-3">Email</th>
            <th className="px-4 py-3">Signup date</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {entries.map((entry) => (
            <tr key={entry.id}>
              <td className="px-4 py-3 font-medium text-zinc-900">{entry.name}</td>
              <td className="px-4 py-3 text-zinc-600">{entry.phone}</td>
              <td className="px-4 py-3 text-zinc-600">{entry.email}</td>
              <td className="px-4 py-3 text-zinc-600">{formatDate(entry.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function AdminSchoolOfPurposeClient() {
  const { data: entries, isLoading, isError } = useQuery({
    queryKey: ADMIN_QUERY_KEYS.schoolOfPurposeWaitlist,
    queryFn: getAdminSchoolOfPurposeWaitlist,
  });
  const entryCount = entries?.length ?? 0;

  return (
    <div className="grid gap-6">
      <PageHeader
        title="School of Purpose waitlist"
        description={
          isLoading
            ? "Loading signups"
            : `${entryCount} signup${entryCount === 1 ? "" : "s"}`
        }
      />

      <section className="overflow-hidden rounded-sm border border-zinc-200 bg-white">
        <div className="border-b border-zinc-100 px-4 py-3">
          <h2 className="ppc-heading text-sm font-semibold text-zinc-900">
            Name, WhatsApp number, email, and signup date
          </h2>
          <p className="mt-0.5 text-xs text-zinc-500">
            Collected from signed-in visitors on the dashboard.
          </p>
        </div>

        {isError ? (
          <div className="px-4 py-10 text-sm text-rose-700">
            The waitlist could not be loaded. Try again shortly.
          </div>
        ) : isLoading ? (
          <div className="grid gap-2 p-4" aria-busy="true" aria-label="Loading waitlist">
            <div className="h-9 animate-pulse rounded-sm bg-zinc-100" />
            <div className="h-9 animate-pulse rounded-sm bg-zinc-100" />
            <div className="h-9 animate-pulse rounded-sm bg-zinc-100" />
          </div>
        ) : (
          <WaitlistTable entries={entries ?? []} />
        )}
      </section>
    </div>
  );
}
