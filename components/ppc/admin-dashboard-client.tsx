"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  Clock3,
  FolderKanban,
  MessageCircle,
  Settings2,
  Users,
} from "lucide-react";

import { getAdminDashboardData } from "@/app/admin/_actions/read-actions";
import {
  QaInboxPreview,
  ReviewQueuePreview,
} from "@/components/ppc/admin-dashboard-previews";
import { PageHeader } from "@/components/ppc/page-header";
import { StatCard } from "@/components/ppc/stat-card";
import { ADMIN_QUERY_KEYS } from "@/lib/admin-query";

function AdminDashboardSkeleton() {
  return (
    <div className="grid gap-6" aria-busy="true" aria-label="Loading dashboard">
      <PageHeader title="Dashboard" description="Loading course operations" />
      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-24 animate-pulse rounded-sm border border-zinc-200 bg-white"
          />
        ))}
      </section>
      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <div className="h-52 animate-pulse rounded-sm border border-zinc-200 bg-white xl:col-span-2" />
        <div className="h-72 animate-pulse rounded-sm border border-zinc-200 bg-white" />
        <div className="h-72 animate-pulse rounded-sm border border-zinc-200 bg-white" />
      </section>
    </div>
  );
}

export function AdminDashboardClient() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ADMIN_QUERY_KEYS.dashboard,
    queryFn: getAdminDashboardData,
  });

  if (isLoading) {
    return <AdminDashboardSkeleton />;
  }

  if (isError || !data) {
    return (
      <div className="grid gap-6">
        <PageHeader
          title="Dashboard"
          description="Course operations overview"
        />
        <div className="rounded-sm border border-rose-200 bg-rose-50 px-4 py-10 text-sm text-rose-700">
          Dashboard data could not be loaded. Try again shortly.
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Dashboard"
        description="Course operations overview"
      />

      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {data.overviewCards.map((card) => (
          <StatCard
            key={card.label}
            label={card.label}
            value={card.value}
            hint={card.hint}
          />
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <article className="rounded-sm border border-zinc-200 bg-white p-4 xl:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="ppc-heading text-sm font-semibold text-zinc-900">
                Quick actions
              </h3>
              <p className="text-[11px] text-zinc-500">
                Jump straight into the most common staff workflows
              </p>
            </div>
          </div>

          <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
            <Link
              href="/admin/review"
              className="rounded-sm border border-zinc-200 bg-zinc-50 px-3 py-3 transition-colors hover:border-zinc-300 hover:bg-white"
            >
              <div className="flex items-center justify-between">
                <Clock3 className="size-4 text-zinc-500" />
                <ArrowRight className="size-3.5 text-zinc-300" />
              </div>
              <p className="mt-3 text-xs font-medium text-zinc-900">
                Review queue
              </p>
              <p className="mt-1 text-[11px] text-zinc-500">
                {data.reviewOwnership.mine > 0
                  ? `${data.reviewOwnership.mine} assigned to you · ${data.reviewOwnership.unassigned} waiting for pickup`
                  : `${data.reviewOwnership.unassigned} waiting for pickup · ${data.reviewPressure.hint.toLowerCase()}`}
              </p>
            </Link>

            <Link
              href="/admin/qa"
              className="rounded-sm border border-zinc-200 bg-zinc-50 px-3 py-3 transition-colors hover:border-zinc-300 hover:bg-white"
            >
              <div className="flex items-center justify-between">
                <MessageCircle className="size-4 text-zinc-500" />
                <ArrowRight className="size-3.5 text-zinc-300" />
              </div>
              <p className="mt-3 text-xs font-medium text-zinc-900">
                Q&amp;A inbox
              </p>
              <p className="mt-1 text-[11px] text-zinc-500">
                {data.qaOwnership.mine > 0
                  ? `${data.qaOwnership.mine} assigned to you · ${data.qaOwnership.unassigned} waiting for pickup`
                  : `${data.qaOwnership.unassigned} waiting for pickup · ${data.qaPressure.hint.toLowerCase()}`}
              </p>
            </Link>

            <Link
              href="/admin/students"
              className="rounded-sm border border-zinc-200 bg-zinc-50 px-3 py-3 transition-colors hover:border-zinc-300 hover:bg-white"
            >
              <div className="flex items-center justify-between">
                <Users className="size-4 text-zinc-500" />
                <ArrowRight className="size-3.5 text-zinc-300" />
              </div>
              <p className="mt-3 text-xs font-medium text-zinc-900">
                Registrants
              </p>
              <p className="mt-1 text-[11px] text-zinc-500">
                View signups, progress, and status
              </p>
            </Link>

            {data.staffAccessSummary ? (
              <Link
                href="/admin/staff"
                className="rounded-sm border border-zinc-200 bg-zinc-50 px-3 py-3 transition-colors hover:border-zinc-300 hover:bg-white"
              >
                <div className="flex items-center justify-between">
                  <Users className="size-4 text-zinc-500" />
                  <ArrowRight className="size-3.5 text-zinc-300" />
                </div>
                <p className="mt-3 text-xs font-medium text-zinc-900">
                  Staff access
                </p>
                <p className="mt-1 text-[11px] text-zinc-500">
                  {data.staffAccessSummary.totalStaff} staff accounts ·{" "}
                  {data.staffAccessSummary.hint}
                </p>
              </Link>
            ) : null}

            <Link
              href={
                data.canManageContent
                  ? "/admin/content"
                  : "/admin/notifications"
              }
              className="rounded-sm border border-zinc-200 bg-zinc-50 px-3 py-3 transition-colors hover:border-zinc-300 hover:bg-white"
            >
              <div className="flex items-center justify-between">
                {data.canManageContent ? (
                  <FolderKanban className="size-4 text-zinc-500" />
                ) : (
                  <Settings2 className="size-4 text-zinc-500" />
                )}
                <ArrowRight className="size-3.5 text-zinc-300" />
              </div>
              <p className="mt-3 text-xs font-medium text-zinc-900">
                {data.canManageContent ? "Content authoring" : "Notification settings"}
              </p>
              <p className="mt-1 text-[11px] text-zinc-500">
                {data.canManageContent
                  ? `${data.contentDebt.incompleteDraftLessons} incomplete · ${data.contentDebt.readyDraftLessons} ready`
                  : "Monitor reminder policy and delivery channels"}
              </p>
            </Link>
          </div>
        </article>

        <article className="rounded-sm border border-zinc-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="ppc-heading text-sm font-semibold text-zinc-900">
                Platform snapshot
              </h3>
              <p className="text-[11px] text-zinc-500">
                Current platform totals and publishing state
              </p>
            </div>
            {data.canManageContent ? (
              <Link
                href="/admin/platform"
                className="text-[11px] font-medium text-zinc-500 hover:text-zinc-900"
              >
                Open controls
              </Link>
            ) : null}
          </div>

          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <div className="rounded-sm border border-zinc-100 bg-zinc-50 px-3 py-3">
              <p className="text-[10px] uppercase tracking-[0.12em] text-zinc-400">
                Users
              </p>
              <p className="mt-1 text-lg font-semibold text-zinc-950">
                {data.counts.users}
              </p>
            </div>
            <div className="rounded-sm border border-zinc-100 bg-zinc-50 px-3 py-3">
              <p className="text-[10px] uppercase tracking-[0.12em] text-zinc-400">
                Published lessons
              </p>
              <p className="mt-1 text-lg font-semibold text-zinc-950">
                {data.counts.publishedLessons}
              </p>
            </div>
            <div className="rounded-sm border border-zinc-100 bg-zinc-50 px-3 py-3">
              <p className="text-[10px] uppercase tracking-[0.12em] text-zinc-400">
                Incomplete drafts
              </p>
              <p className="mt-1 text-lg font-semibold text-zinc-950">
                {data.contentDebt.incompleteDraftLessons}
              </p>
              <p className="mt-1 text-[11px] text-zinc-500">
                {data.contentDebt.readyDraftLessons} ready to publish
              </p>
            </div>
            <div className="rounded-sm border border-zinc-100 bg-zinc-50 px-3 py-3">
              <p className="text-[10px] uppercase tracking-[0.12em] text-zinc-400">
                Published gaps
              </p>
              <p className="mt-1 text-lg font-semibold text-zinc-950">
                {data.contentDebt.publishedWithGaps}
              </p>
              <p className="mt-1 text-[11px] text-zinc-500">
                {data.contentDebt.totalDebt} total content debt
              </p>
            </div>
            {data.staffAccessSummary ? (
              <>
                <div className="rounded-sm border border-zinc-100 bg-zinc-50 px-3 py-3">
                  <p className="text-[10px] uppercase tracking-[0.12em] text-zinc-400">
                    Staff accounts
                  </p>
                  <p className="mt-1 text-lg font-semibold text-zinc-950">
                    {data.staffAccessSummary.totalStaff}
                  </p>
                  <p className="mt-1 text-[11px] text-zinc-500">
                    {data.staffAccessSummary.admins} admins ·{" "}
                    {data.staffAccessSummary.instructors} instructors
                  </p>
                </div>
                <div className="rounded-sm border border-zinc-100 bg-zinc-50 px-3 py-3">
                  <p className="text-[10px] uppercase tracking-[0.12em] text-zinc-400">
                    Staff invites
                  </p>
                  <p className="mt-1 text-lg font-semibold text-zinc-950">
                    {data.staffAccessSummary.pendingInvites}
                  </p>
                  <p className="mt-1 text-[11px] text-zinc-500">
                    {data.staffAccessSummary.expiredInvites} expired ·{" "}
                    {data.staffAccessSummary.acceptedInvites} accepted
                  </p>
                </div>
              </>
            ) : null}
            <div className="rounded-sm border border-zinc-100 bg-zinc-50 px-3 py-3 sm:col-span-2">
              <p className="text-[10px] uppercase tracking-[0.12em] text-zinc-400">
                Content watchlist
              </p>
              {data.contentDebt.topItems.length ? (
                <div className="mt-2 grid gap-1.5">
                  {data.contentDebt.topItems.map((item) => (
                    <div
                      key={item.id}
                      className={`rounded-sm border px-2.5 py-2 text-[11px] ${
                        item.tone === "warning"
                          ? "border-amber-200 bg-amber-50 text-amber-800"
                          : "border-zinc-200 bg-white text-zinc-600"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-medium">{item.title}</span>
                        <span>{item.detail}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-[11px] text-zinc-500">
                  No draft lessons waiting on admin action.
                </p>
              )}
            </div>
          </div>
        </article>

        <article className="rounded-sm border border-zinc-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="ppc-heading text-sm font-semibold text-zinc-900">
                Assignment snapshot
              </h3>
              <p className="text-[11px] text-zinc-500">
                What is yours now and what still needs pickup
              </p>
            </div>
          </div>

          <div className="mt-3 grid gap-2">
            <div className="rounded-sm border border-zinc-100 bg-zinc-50 px-3 py-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.12em] text-zinc-400">
                    Review queue
                  </p>
                  <p className="mt-1 text-lg font-semibold text-zinc-950">
                    {data.reviewOwnership.mine} mine
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase tracking-[0.12em] text-zinc-400">
                    Unassigned
                  </p>
                  <p className="mt-1 text-lg font-semibold text-zinc-950">
                    {data.reviewOwnership.unassigned}
                  </p>
                </div>
              </div>
              <p className="mt-2 text-[11px] text-zinc-500">
                {data.reviewOwnership.mine > 0
                  ? data.reviewOwnership.mineHint
                  : data.reviewOwnership.unassignedHint}
              </p>
            </div>

            <div className="rounded-sm border border-zinc-100 bg-zinc-50 px-3 py-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.12em] text-zinc-400">
                    Q&amp;A inbox
                  </p>
                  <p className="mt-1 text-lg font-semibold text-zinc-950">
                    {data.qaOwnership.mine} mine
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase tracking-[0.12em] text-zinc-400">
                    Unassigned
                  </p>
                  <p className="mt-1 text-lg font-semibold text-zinc-950">
                    {data.qaOwnership.unassigned}
                  </p>
                </div>
              </div>
              <p className="mt-2 text-[11px] text-zinc-500">
                {data.qaOwnership.mine > 0
                  ? data.qaOwnership.mineHint
                  : data.qaOwnership.unassignedHint}
              </p>
            </div>
          </div>
        </article>

        <article className="rounded-sm border border-zinc-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <h3 className="ppc-heading text-sm font-semibold text-zinc-900">
              Review queue
            </h3>
            <Link
              href="/admin/review"
              className="text-[11px] font-medium text-zinc-500 hover:text-zinc-900"
            >
              View all
            </Link>
          </div>
          <p className="mt-1 text-[11px] text-zinc-500">
            Prioritised to show your assigned work first, then unassigned items.
          </p>
          <div className="mt-3 grid gap-2">
            <ReviewQueuePreview
              rows={data.reviewQueuePreview}
              currentStaffId={data.currentStaffId}
            />
          </div>
        </article>

        <article className="rounded-sm border border-zinc-200 bg-white p-4 xl:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="ppc-heading text-sm font-semibold text-zinc-900">
              Open Q&A threads
            </h3>
            <Link
              href="/admin/qa"
              className="text-[11px] font-medium text-zinc-500 hover:text-zinc-900"
            >
              View all
            </Link>
          </div>
          <p className="mt-1 text-[11px] text-zinc-500">
            Prioritised to show your assigned threads first, then unassigned threads.
          </p>
          <div className="mt-3">
            <QaInboxPreview
              rows={data.qaPreview}
              currentStaffId={data.currentStaffId}
            />
          </div>
        </article>
      </section>
    </div>
  );
}
