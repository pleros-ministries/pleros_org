"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import type { AdminGroupRow } from "@/lib/db/queries/community-groups";
import { setCommunityGroupArchived } from "@/app/(site)/dashboard/community/_actions/group-actions";

const dateFmt = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "Africa/Lagos",
});

/** Every member-created group, with a link to open it and a close/reopen control. */
export function AdminGroupsSection({ groups }: { groups: AdminGroupRow[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function setArchived(groupId: number, archived: boolean) {
    setMessage(null);
    startTransition(async () => {
      try {
        const result = await setCommunityGroupArchived({ groupId, archived });
        setMessage(
          result.ok
            ? archived
              ? "Group closed."
              : "Group reopened."
            : result.error,
        );
        router.refresh();
      } catch {
        setMessage("Action failed.");
      }
    });
  }

  return (
    <section className="grid gap-2">
      <h2 className="ppc-heading text-sm font-semibold text-zinc-900">
        Member-created groups ({groups.length})
      </h2>
      <p className="text-xs text-zinc-500">
        Groups learners have started. Open one to see its discussions and
        members; you can read private groups too.
      </p>
      {message ? (
        <p role="status" className="text-xs text-zinc-600">
          {message}
        </p>
      ) : null}
      <div className="overflow-x-auto rounded-sm border border-zinc-200 bg-white">
        <table className="w-full text-left text-xs">
          <thead className="bg-zinc-50 text-zinc-500">
            <tr>
              <th className="px-3 py-2 font-medium">Group</th>
              <th className="px-3 py-2 font-medium">Privacy</th>
              <th className="px-3 py-2 font-medium">Members</th>
              <th className="px-3 py-2 font-medium">Owner</th>
              <th className="px-3 py-2 font-medium">Started</th>
              <th className="px-3 py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {groups.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-zinc-500">
                  No one has started a group yet.
                </td>
              </tr>
            ) : (
              groups.map((group) => {
                const archived = group.status === "archived";
                return (
                  <tr key={group.id} className={archived ? "opacity-50" : ""}>
                    <td className="px-3 py-2 font-medium">
                      <Link
                        href={`/dashboard/community/groups/${group.id}`}
                        className="text-[var(--color-brand-blue)] underline underline-offset-2"
                      >
                        {group.name}
                      </Link>
                    </td>
                    <td className="px-3 py-2">
                      {group.privacy === "public" ? "Public" : "Private"}
                    </td>
                    <td className="px-3 py-2">{group.memberCount}</td>
                    <td className="px-3 py-2">{group.ownerName ?? "—"}</td>
                    <td className="px-3 py-2">
                      {dateFmt.format(new Date(group.createdAt))}
                    </td>
                    <td className="px-3 py-2">
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => setArchived(group.id, !archived)}
                        className="text-[var(--color-brand-blue)] underline underline-offset-2"
                      >
                        {archived ? "Reopen" : "Close"}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
