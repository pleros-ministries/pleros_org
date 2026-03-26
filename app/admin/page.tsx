import { redirect } from "next/navigation";
import Link from "next/link";
import { eq, count } from "drizzle-orm";

import { getAppSession } from "@/lib/app-session";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { getDashboardStats } from "@/lib/db/queries/students";
import { getReviewQueue } from "@/lib/db/queries/submissions";
import { getAllThreads } from "@/lib/db/queries/qa";
import { getContentOverview } from "@/lib/db/queries/content";
import { PpcAppFrame } from "@/components/ppc/ppc-app-frame";
import { PageHeader } from "@/components/ppc/page-header";
import { StaffLoginPanel } from "@/components/ppc/staff-login-panel";
import { StatCard } from "@/components/ppc/stat-card";
import {
  Activity,
  ArrowRight,
  Clock3,
  FolderKanban,
  Layers2,
  MessageCircle,
  Settings2,
  Users,
} from "lucide-react";

export default async function AdminEntryPage() {
  const session = await getAppSession();

  if (!session) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-md items-center px-5 py-10">
        <section className="w-full rounded-sm border border-zinc-200 bg-white p-6 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
            Staff portal
          </p>
          <h1 className="mt-2 text-xl font-semibold tracking-tight text-zinc-950">
            Login
          </h1>

          <StaffLoginPanel />

          <p className="mt-4 text-[11px] text-zinc-400">
            Student access remains at{" "}
            <Link href="/ppc" className="underline">
              /ppc
            </Link>
            .
          </p>
        </section>
      </main>
    );
  }

  if (session.user.role === "student") {
    redirect("/ppc");
  }

  const stats = await getDashboardStats();
  const reviewQueue = await getReviewQueue();
  const openThreads = await getAllThreads("open");
  const contentOverview = await getContentOverview();
  const [userCount] = await db.select({ count: count() }).from(schema.users);
  const [lessonCount] = await db
    .select({ count: count() })
    .from(schema.lessons)
    .where(eq(schema.lessons.status, "published"));
  const draftLessons = contentOverview.reduce(
    (total, level) => total + level.draftCount,
    0,
  );
  const levelsWithDrafts = contentOverview.filter((level) => level.draftCount > 0);

  return (
    <PpcAppFrame session={session}>
      <div className="grid gap-6">
        <PageHeader
          title="Dashboard"
          description="Course operations overview"
        />

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Active students"
            value={stats.activeStudents}
            icon={Activity}
            hint="Currently enrolled"
          />
          <StatCard
            label="Avg. progress"
            value={`${stats.averageProgress}%`}
            icon={Layers2}
            hint="Across cohort"
          />
          <StatCard
            label="Pending reviews"
            value={stats.pendingReviews}
            icon={Clock3}
            hint="Awaiting grading"
          />
          <StatCard
            label="Open Q&A"
            value={stats.openQa}
            icon={MessageCircle}
            hint="Student threads"
          />
        </section>

        <section className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
          <article className="rounded-sm border border-zinc-200 bg-white p-4 xl:col-span-2">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-zinc-900">
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
                  {reviewQueue.length} submissions across the queue
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
                  {openThreads.length} open student threads
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
                  Student roster
                </p>
                <p className="mt-1 text-[11px] text-zinc-500">
                  View progress, support history, and status
                </p>
              </Link>

              <Link
                href={
                  session.user.role === "admin"
                    ? "/admin/content"
                    : "/admin/notifications"
                }
                className="rounded-sm border border-zinc-200 bg-zinc-50 px-3 py-3 transition-colors hover:border-zinc-300 hover:bg-white"
              >
                <div className="flex items-center justify-between">
                  {session.user.role === "admin" ? (
                    <FolderKanban className="size-4 text-zinc-500" />
                  ) : (
                    <Settings2 className="size-4 text-zinc-500" />
                  )}
                  <ArrowRight className="size-3.5 text-zinc-300" />
                </div>
                <p className="mt-3 text-xs font-medium text-zinc-900">
                  {session.user.role === "admin"
                    ? "Content authoring"
                    : "Notification settings"}
                </p>
                <p className="mt-1 text-[11px] text-zinc-500">
                  {session.user.role === "admin"
                    ? `${draftLessons} draft lessons waiting for review`
                    : "Monitor reminder policy and delivery channels"}
                </p>
              </Link>
            </div>
          </article>

          <article className="rounded-sm border border-zinc-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-zinc-900">
                  Platform snapshot
                </h3>
                <p className="text-[11px] text-zinc-500">
                  Current platform totals and publishing state
                </p>
              </div>
              {session.user.role === "admin" ? (
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
                  {userCount?.count ?? 0}
                </p>
              </div>
              <div className="rounded-sm border border-zinc-100 bg-zinc-50 px-3 py-3">
                <p className="text-[10px] uppercase tracking-[0.12em] text-zinc-400">
                  Published lessons
                </p>
                <p className="mt-1 text-lg font-semibold text-zinc-950">
                  {lessonCount?.count ?? 0}
                </p>
              </div>
              <div className="rounded-sm border border-zinc-100 bg-zinc-50 px-3 py-3">
                <p className="text-[10px] uppercase tracking-[0.12em] text-zinc-400">
                  Draft lessons
                </p>
                <p className="mt-1 text-lg font-semibold text-zinc-950">
                  {draftLessons}
                </p>
              </div>
              <div className="rounded-sm border border-zinc-100 bg-zinc-50 px-3 py-3 sm:col-span-2">
                <p className="text-[10px] uppercase tracking-[0.12em] text-zinc-400">
                  Content watchlist
                </p>
                {levelsWithDrafts.length ? (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {levelsWithDrafts.map((level) => (
                      <span
                        key={level.id}
                        className="rounded-sm border border-zinc-200 bg-white px-2 py-1 text-[10px] text-zinc-600"
                      >
                        {level.title}: {level.draftCount} draft
                        {level.draftCount === 1 ? "" : "s"}
                      </span>
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
              <h3 className="text-sm font-semibold text-zinc-900">
                Review queue
              </h3>
              <Link
                href="/admin/review"
                className="text-[11px] font-medium text-zinc-500 hover:text-zinc-900"
              >
                View all
              </Link>
            </div>
            <div className="mt-3 grid gap-2">
              {reviewQueue.slice(0, 5).map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-sm border border-zinc-100 px-3 py-2"
                >
                  <div>
                    <p className="text-xs font-medium text-zinc-900">
                      {item.studentName}
                    </p>
                    <p className="text-[11px] text-zinc-500">
                      L{item.levelId}.{item.lessonNumber} - {item.lessonTitle}
                    </p>
                  </div>
                  <span className="text-[10px] capitalize text-zinc-400">
                    {item.status.replace(/_/g, " ")}
                  </span>
                </div>
              ))}
              {reviewQueue.length === 0 ? (
                <p className="text-xs text-zinc-400">
                  No submissions to review
                </p>
              ) : null}
            </div>
          </article>

          <article className="rounded-sm border border-zinc-200 bg-white p-4 xl:col-span-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-zinc-900">
                Open Q&A threads
              </h3>
              <Link
                href="/admin/qa"
                className="text-[11px] font-medium text-zinc-500 hover:text-zinc-900"
              >
                View all
              </Link>
            </div>
            <div className="mt-3 grid gap-2 md:grid-cols-2">
              {openThreads.slice(0, 6).map((thread) => (
                <div
                  key={thread.id}
                  className="rounded-sm border border-zinc-100 px-3 py-2"
                >
                  <p className="text-xs font-medium text-zinc-900">
                    {thread.subject}
                  </p>
                  <p className="text-[11px] text-zinc-500">
                    {thread.studentName} - L{thread.levelId}.{thread.lessonNumber}
                  </p>
                </div>
              ))}
              {openThreads.length === 0 ? (
                <p className="text-xs text-zinc-400">
                  No open threads
                </p>
              ) : null}
            </div>
          </article>
        </section>
      </div>
    </PpcAppFrame>
  );
}
