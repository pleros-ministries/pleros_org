import { redirect } from "next/navigation";

import { PastorFollowupView } from "@/components/ppc/pastor-followup-view";
import { getAppSession } from "@/lib/app-session";
import { requirePastorOrAdmin } from "@/lib/auth/require-role";
import { hasAdminAccess } from "@/lib/app-role";
import { getChurchAssignment } from "@/lib/db/queries/church-organisation";
import {
  getAllCohorts,
  getAllSogpEnrollees,
  getPastorCohorts,
  getPastorEnrollees,
  listPastors,
} from "@/lib/db/queries/pastor-followups";
import { getCohortMoveStates, getCohortMoveTarget } from "@/lib/db/queries/sogp-cohort-moves";
import {
  listEligibleSogpDisciplers,
  listScopedSogpEnrollees,
  listSogpOversightBranches,
  listSogpTransferBranches,
} from "@/lib/db/queries/sogp-branch-oversight";
import { ALL_PASTORS } from "@/lib/sogp/daily-participation";
import {
  assignEnrolleeAction,
  placeEnrolleeInBranchAction,
  releaseEnrolleeAction,
  requestEnrolleeTransferAction,
} from "./actions";

type Enrollee = Awaited<ReturnType<typeof listScopedSogpEnrollees>>[number];
type Branch = Awaited<ReturnType<typeof listSogpTransferBranches>>[number];
type Discipler = Awaited<ReturnType<typeof listEligibleSogpDisciplers>>[number];

function ChurchSogpOversight({
  enrollees,
  branches,
  placementBranches,
  disciplers,
  notice,
}: {
  enrollees: Enrollee[];
  branches: Branch[];
  placementBranches: Branch[];
  disciplers: Discipler[];
  notice?: string;
}) {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-zinc-500">SOGP oversight</p>
          <h1 className="mt-1 text-2xl font-medium text-zinc-950">Enrollees</h1>
          <p className="mt-1 text-sm text-zinc-600">Place people in branches, assign a discipler, or release and transfer them.</p>
        </div>
        <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700">{enrollees.length} visible</span>
      </div>

      {notice ? <p className="mb-5 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-700">{notice}</p> : null}

      <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 text-xs text-zinc-500">
              <tr><th className="px-4 py-3 font-medium">Learner</th><th className="px-4 py-3 font-medium">Branch</th><th className="px-4 py-3 font-medium">Discipler</th><th className="px-4 py-3 font-medium">Status</th><th className="px-4 py-3 font-medium">Manage</th></tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {enrollees.map((enrollee) => {
                const eligible = disciplers.filter((person) => person.branchId === enrollee.branchId);
                const transferBranches = branches.filter((branch) => branch.id !== enrollee.branchId);
                return (
                  <tr key={enrollee.enrollmentId} className="align-top">
                    <td className="px-4 py-4"><p className="font-medium text-zinc-950">{enrollee.name}</p><p className="mt-0.5 text-xs text-zinc-500">{enrollee.email}</p><p className="mt-1 text-xs text-zinc-500">{enrollee.cohortTitle}</p></td>
                    <td className="px-4 py-4">
                      {enrollee.branchName ? <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700">{enrollee.branchName}</span> : (
                        <form action={placeEnrolleeInBranchAction} className="flex gap-2">
                          <input type="hidden" name="enrollmentId" value={enrollee.enrollmentId} />
                          <select name="branchId" required className="rounded-lg border border-zinc-300 px-2 py-1.5 text-xs"><option value="">Choose branch</option>{placementBranches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}</select>
                          <button className="rounded-full bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white">Place</button>
                        </form>
                      )}
                    </td>
                    <td className="px-4 py-4">{enrollee.disciplerName ?? <span className="text-zinc-400">Unassigned</span>}</td>
                    <td className="px-4 py-4"><span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-800">{enrollee.status}</span></td>
                    <td className="px-4 py-4">
                      <details>
                        <summary className="cursor-pointer text-xs font-medium text-violet-700">Manage</summary>
                        <div className="mt-3 grid min-w-72 gap-3">
                          {enrollee.branchId ? (
                            <form action={assignEnrolleeAction} className="flex gap-2">
                              <input type="hidden" name="enrollmentId" value={enrollee.enrollmentId} />
                              <select name="disciplerUserId" required className="min-w-0 flex-1 rounded-lg border border-zinc-300 px-2 py-1.5 text-xs"><option value="">Choose discipler</option>{eligible.map((person) => <option key={person.userId} value={person.userId}>{person.name}</option>)}</select>
                              <button className="rounded-full bg-violet-700 px-3 py-1.5 text-xs font-medium text-white">Assign</button>
                            </form>
                          ) : null}
                          {enrollee.disciplerUserId ? <form action={releaseEnrolleeAction}><input type="hidden" name="enrollmentId" value={enrollee.enrollmentId} /><button className="rounded-full border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700">Release discipler</button></form> : null}
                          {enrollee.branchId && transferBranches.length ? (
                            <form action={requestEnrolleeTransferAction} className="flex gap-2">
                              <input type="hidden" name="enrollmentId" value={enrollee.enrollmentId} />
                              <select name="toBranchId" required className="min-w-0 flex-1 rounded-lg border border-zinc-300 px-2 py-1.5 text-xs"><option value="">Transfer to…</option>{transferBranches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}</select>
                              <button className="rounded-full border border-violet-300 px-3 py-1.5 text-xs font-medium text-violet-800">Transfer</button>
                            </form>
                          ) : null}
                        </div>
                      </details>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

export default async function PastorMyEnrolleesPage({
  searchParams,
}: {
  searchParams: Promise<{ pastorId?: string; notice?: string }>;
}) {
  const session = await getAppSession();
  if (!session) redirect("/admin");
  const churchAssignment = await getChurchAssignment(session.user.id);
  if (churchAssignment?.role === "pastor" || churchAssignment?.role === "branch_pastor") {
    const params = await searchParams;
    const [enrollees, branches, placementBranches, disciplers] = await Promise.all([
      listScopedSogpEnrollees(session.user.id),
      listSogpTransferBranches(session.user.id),
      listSogpOversightBranches(session.user.id),
      listEligibleSogpDisciplers(session.user.id),
    ]);
    return <ChurchSogpOversight enrollees={enrollees} branches={branches} placementBranches={placementBranches} disciplers={disciplers} notice={params.notice} />;
  }

  await requirePastorOrAdmin();
  const isAdmin = hasAdminAccess(session.user.role);

  const { pastorId: requested } = await searchParams;
  const [allPastors, moveTarget] = await Promise.all([
    isAdmin ? listPastors() : [],
    getCohortMoveTarget(),
  ]);

  // Admins default to every enrollee; `?pastorId=` narrows to one pastor's
  // queue (including their own, for an admin who doubles as a pastor).
  // Pastors always see their own queue.
  const targetPastorId = isAdmin ? (requested || ALL_PASTORS) : session.user.id;
  const showAll = targetPastorId === ALL_PASTORS;

  const [enrollees, cohorts, moveStates] = await Promise.all([
    showAll ? getAllSogpEnrollees() : getPastorEnrollees(targetPastorId),
    showAll ? getAllCohorts() : getPastorCohorts(targetPastorId),
    getCohortMoveStates({
      targetCohortId: moveTarget?.id ?? null,
      pastorUserId: showAll ? undefined : targetPastorId,
    }),
  ]);

  return (
    <PastorFollowupView
      enrollees={enrollees}
      cohorts={cohorts}
      isAdmin={isAdmin}
      pastorOptions={allPastors.map((p) => ({ id: p.id, name: p.name }))}
      selectedPastorId={targetPastorId}
      moveTarget={moveTarget}
      moveStates={moveStates}
    />
  );
}
