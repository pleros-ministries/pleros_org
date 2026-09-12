"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import {
  assignPastorToEnrollment,
  bulkAssignPastorToAllInRegion,
  removePastorRegionAssignment,
  setAdminAsPastor,
  setPastorRegionAssignment,
  unassignPastorFromEnrollment,
} from "@/app/admin/_actions/pastor-actions";
import { PageHeader } from "@/components/ppc/page-header";
import type {
  AdminForPastorFlag,
  PastorSummary,
  RegionWithPastor,
  SogpEnrolleeForAssignment,
} from "@/lib/db/queries/pastor-followups";

function relativeTime(iso: string | null): string {
  if (!iso) return "Never";
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.round(diff / 60_000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return `${Math.round(hr / 24)}d ago`;
}

function PastorAssignCell({
  enrollmentId,
  currentPastorId,
  pastors,
  disabled,
  onChange,
}: {
  enrollmentId: number;
  currentPastorId: string | null;
  pastors: PastorSummary[];
  disabled: boolean;
  onChange: (enrollmentId: number, pastorUserId: string | null) => void;
}) {
  return (
    <select
      value={currentPastorId ?? ""}
      disabled={disabled}
      onChange={(event) =>
        onChange(enrollmentId, event.target.value || null)
      }
      className="h-7 rounded-sm border border-zinc-200 bg-white px-2 text-xs"
    >
      <option value="">Unassigned</option>
      {pastors.map((pastor) => (
        <option key={pastor.id} value={pastor.id}>
          {pastor.name}
        </option>
      ))}
    </select>
  );
}

function RegionRow({
  region,
  pastors,
  disabled,
  onChangePastor,
  onBulkAssign,
}: {
  region: RegionWithPastor;
  pastors: PastorSummary[];
  disabled: boolean;
  onChangePastor: (unitId: number, pastorUserId: string | null) => void;
  onBulkAssign: (unitId: number, pastorUserId: string) => void;
}) {
  return (
    <tr>
      <td className="px-4 py-3">
        <p className="font-medium text-zinc-900">{region.unitName}</p>
      </td>
      <td className="px-4 py-3">{region.enrolleeCount}</td>
      <td className="px-4 py-3">
        <select
          value={region.pastorUserId ?? ""}
          disabled={disabled}
          onChange={(event) =>
            onChangePastor(region.unitId, event.target.value || null)
          }
          className="h-7 rounded-sm border border-zinc-200 bg-white px-2 text-xs"
        >
          <option value="">Unassigned</option>
          {pastors.map((pastor) => (
            <option key={pastor.id} value={pastor.id}>
              {pastor.name}
            </option>
          ))}
        </select>
      </td>
      <td className="px-4 py-3">
        <button
          type="button"
          disabled={disabled || !region.pastorUserId || region.enrolleeCount === 0}
          onClick={() =>
            region.pastorUserId && onBulkAssign(region.unitId, region.pastorUserId)
          }
          className="inline-flex h-7 items-center rounded-sm border border-zinc-200 bg-white px-2.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Assign all {region.enrolleeCount} enrollee
          {region.enrolleeCount === 1 ? "" : "s"} here
        </button>
      </td>
    </tr>
  );
}

export function AdminPastorsPage({
  pastors,
  enrollees,
  admins,
  regions,
}: {
  pastors: PastorSummary[];
  enrollees: SogpEnrolleeForAssignment[];
  admins: AdminForPastorFlag[];
  regions: RegionWithPastor[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [onlyUnassigned, setOnlyUnassigned] = useState(false);
  const [whatsappOnly, setWhatsappOnly] = useState(false);

  const [notice, setNotice] = useState<string | null>(null);

  function handleTogglePastorFlag(userId: string, isPastor: boolean) {
    setError(null);
    startTransition(async () => {
      try {
        await setAdminAsPastor({ userId, isPastor });
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not update that admin.");
      }
    });
  }

  function handleChangeRegionPastor(unitId: number, pastorUserId: string | null) {
    setError(null);
    setNotice(null);
    startTransition(async () => {
      try {
        if (pastorUserId) {
          await setPastorRegionAssignment({ unitId, pastorUserId });
        } else {
          await removePastorRegionAssignment({ unitId });
        }
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not update that region.");
      }
    });
  }

  function handleBulkAssign(unitId: number, pastorUserId: string) {
    setError(null);
    setNotice(null);
    startTransition(async () => {
      try {
        const result = await bulkAssignPastorToAllInRegion({ unitId, pastorUserId });
        setNotice(`Assigned ${result.assigned} enrollee${result.assigned === 1 ? "" : "s"}.`);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not bulk-assign that region.");
      }
    });
  }

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return enrollees.filter((item) => {
      if (onlyUnassigned && item.pastorUserId) return false;
      if (whatsappOnly && !item.whatsappConsent) return false;
      if (!query) return true;
      return (
        item.name.toLowerCase().includes(query) ||
        item.email.toLowerCase().includes(query) ||
        item.phone.includes(query)
      );
    });
  }, [enrollees, search, onlyUnassigned, whatsappOnly]);

  function handleAssign(enrollmentId: number, pastorUserId: string | null) {
    setError(null);
    startTransition(async () => {
      try {
        if (pastorUserId) {
          await assignPastorToEnrollment({ enrollmentId, pastorUserId });
        } else {
          await unassignPastorFromEnrollment({ enrollmentId });
        }
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not update assignment.");
      }
    });
  }

  return (
    <div className="grid gap-5">
      <PageHeader
        title="Pastors"
        description="Assign pastors to SOGP enrollees and track follow-up activity."
      />

      <section className="overflow-hidden rounded-sm border border-zinc-200 bg-white">
        <div className="border-b border-zinc-100 px-4 py-3">
          <h2 className="ppc-heading text-sm font-semibold text-zinc-900">
            Pastor activity
          </h2>
        </div>
        <table className="min-w-full text-left text-xs">
          <thead className="bg-zinc-50 text-zinc-500">
            <tr>
              <th className="px-4 py-3">Pastor</th>
              <th className="px-4 py-3">Assigned</th>
              <th className="px-4 py-3">Contacted</th>
              <th className="px-4 py-3">Last activity</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {pastors.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-zinc-500">
                  No pastors yet. Invite one from Staff.
                </td>
              </tr>
            ) : (
              pastors.map((pastor) => (
                <tr key={pastor.id}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-zinc-900">{pastor.name}</p>
                    <p className="mt-0.5 text-[10px] text-zinc-500">{pastor.email}</p>
                  </td>
                  <td className="px-4 py-3">{pastor.assignedCount}</td>
                  <td className="px-4 py-3">{pastor.contactedCount}</td>
                  <td className="px-4 py-3">{relativeTime(pastor.lastContactedAt)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>

      <section className="overflow-hidden rounded-sm border border-zinc-200 bg-white">
        <div className="border-b border-zinc-100 px-4 py-3">
          <h2 className="ppc-heading text-sm font-semibold text-zinc-900">
            Admins
          </h2>
          <p className="mt-0.5 text-xs text-zinc-500">
            Mark an admin as also acting as a pastor to make them assignable
            above — they keep full admin access either way.
          </p>
        </div>
        <table className="min-w-full text-left text-xs">
          <thead className="bg-zinc-50 text-zinc-500">
            <tr>
              <th className="px-4 py-3">Admin</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Also a pastor</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {admins.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-10 text-center text-zinc-500">
                  No admins yet.
                </td>
              </tr>
            ) : (
              admins.map((admin) => (
                <tr key={admin.id}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-zinc-900">{admin.name}</p>
                    <p className="mt-0.5 text-[10px] text-zinc-500">{admin.email}</p>
                  </td>
                  <td className="px-4 py-3 capitalize">
                    {admin.role.replaceAll("_", " ")}
                  </td>
                  <td className="px-4 py-3">
                    <label className="flex items-center gap-1.5">
                      <input
                        type="checkbox"
                        checked={admin.isPastor}
                        disabled={pending}
                        onChange={(event) =>
                          handleTogglePastorFlag(admin.id, event.target.checked)
                        }
                      />
                      {admin.isPastor ? "Yes" : "No"}
                    </label>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>

      <section className="overflow-hidden rounded-sm border border-zinc-200 bg-white">
        <div className="border-b border-zinc-100 px-4 py-3">
          <h2 className="ppc-heading text-sm font-semibold text-zinc-900">
            Regions
          </h2>
          <p className="mt-0.5 text-xs text-zinc-500">
            One pastor per region. Setting a pastor here also auto-assigns
            them to anyone who registers into this region from now on —
            &ldquo;Assign all&rdquo; backfills everyone already enrolled here.
          </p>
        </div>

        {notice ? (
          <p className="border-b border-emerald-100 bg-emerald-50 px-4 py-3 text-xs text-emerald-700">
            {notice}
          </p>
        ) : null}

        <table className="min-w-full text-left text-xs">
          <thead className="bg-zinc-50 text-zinc-500">
            <tr>
              <th className="px-4 py-3">Region</th>
              <th className="px-4 py-3">Enrollees</th>
              <th className="px-4 py-3">Pastor</th>
              <th className="px-4 py-3">Bulk assign</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {regions.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-zinc-500">
                  No regions yet.
                </td>
              </tr>
            ) : (
              regions.map((region) => (
                <RegionRow
                  key={region.unitId}
                  region={region}
                  pastors={pastors}
                  disabled={pending}
                  onChangePastor={handleChangeRegionPastor}
                  onBulkAssign={handleBulkAssign}
                />
              ))
            )}
          </tbody>
        </table>
      </section>

      <section className="overflow-hidden rounded-sm border border-zinc-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 px-4 py-3">
          <div>
            <h2 className="ppc-heading text-sm font-semibold text-zinc-900">
              SOGP enrollees
            </h2>
            <p className="mt-0.5 text-xs text-zinc-500">
              Assign a pastor to any enrollee — WhatsApp opt-in only decides
              which contact button they see.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search name, email, phone…"
              className="h-8 rounded-sm border border-zinc-200 px-2.5"
            />
            <label className="flex items-center gap-1.5">
              <input
                type="checkbox"
                checked={onlyUnassigned}
                onChange={(event) => setOnlyUnassigned(event.target.checked)}
              />
              Unassigned only
            </label>
            <label className="flex items-center gap-1.5">
              <input
                type="checkbox"
                checked={whatsappOnly}
                onChange={(event) => setWhatsappOnly(event.target.checked)}
              />
              WhatsApp only
            </label>
          </div>
        </div>

        {error ? (
          <p className="border-b border-rose-100 bg-rose-50 px-4 py-3 text-xs text-rose-700">
            {error}
          </p>
        ) : null}

        <table className="min-w-full text-left text-xs">
          <thead className="bg-zinc-50 text-zinc-500">
            <tr>
              <th className="px-4 py-3">Enrollee</th>
              <th className="px-4 py-3">Cohort</th>
              <th className="px-4 py-3">WhatsApp</th>
              <th className="px-4 py-3">Pastor</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-zinc-500">
                  No enrollees match.
                </td>
              </tr>
            ) : (
              filtered.map((item) => (
                <tr key={item.enrollmentId}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-zinc-900">{item.name}</p>
                    <p className="mt-0.5 text-[10px] text-zinc-500">
                      {item.email} · {item.phone}
                    </p>
                  </td>
                  <td className="px-4 py-3">{item.cohortTitle}</td>
                  <td className="px-4 py-3">
                    {item.whatsappConsent ? "Opted in" : "Not opted in"}
                  </td>
                  <td className="px-4 py-3">
                    <PastorAssignCell
                      enrollmentId={item.enrollmentId}
                      currentPastorId={item.pastorUserId}
                      pastors={pastors}
                      disabled={pending}
                      onChange={handleAssign}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
