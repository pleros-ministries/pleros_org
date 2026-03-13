import { redirect } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";
import { Activity, Clock3, Layers2, MessageCircle } from "lucide-react";

import { getAppSession } from "@/lib/app-session";
import { toExternalPpcPath } from "@/lib/ppc-access";
import { getDashboardStats } from "@/lib/db/queries/students";
import { getReviewQueue } from "@/lib/db/queries/submissions";
import { getAllThreads } from "@/lib/db/queries/qa";
import { PageHeader } from "@/components/ppc/page-header";
import { StatCard } from "@/components/ppc/stat-card";

export default async function StaffDashboardPage() {
  const session = await getAppSession();
  if (!session) {
    const h = await headers();
    redirect(toExternalPpcPath(h.get("host"), "/sign-in"));
  }

  const stats = await getDashboardStats();
  const reviewQueue = await getReviewQueue();
  const openThreads = await getAllThreads("open");

  return (
    <div className="grid gap-6">
      <PageHeader title="Dashboard" description="Course operations overview" />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Active students" value={stats.activeStudents} icon={Activity} hint="Currently enrolled" />
        <StatCard label="Avg. progress" value={`${stats.averageProgress}%`} icon={Layers2} hint="Across cohort" />
        <StatCard label="Pending reviews" value={stats.pendingReviews} icon={Clock3} hint="Awaiting grading" />
        <StatCard label="Open Q&A" value={stats.openQa} icon={MessageCircle} hint="Student threads" />
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <article className="rounded border border-zinc-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-zinc-900">Review queue</h3>
            <Link href="/ppc/review" className="text-[11px] font-medium text-zinc-500 hover:text-zinc-900">View all</Link>
          </div>
          <div className="mt-3 grid gap-2">
            {reviewQueue.slice(0, 5).map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded border border-zinc-100 px-3 py-2">
                <div>
                  <p className="text-xs font-medium text-zinc-900">{item.studentName}</p>
                  <p className="text-[11px] text-zinc-500">L{item.levelId}.{item.lessonNumber} — {item.lessonTitle}</p>
                </div>
                <span className="text-[10px] capitalize text-zinc-400">{item.status.replace(/_/g, " ")}</span>
              </div>
            ))}
            {reviewQueue.length === 0 && <p className="text-xs text-zinc-400">No submissions to review</p>}
          </div>
        </article>

        <article className="rounded border border-zinc-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-zinc-900">Open Q&A threads</h3>
            <Link href="/ppc/qa" className="text-[11px] font-medium text-zinc-500 hover:text-zinc-900">View all</Link>
          </div>
          <div className="mt-3 grid gap-2">
            {openThreads.slice(0, 5).map((thread) => (
              <div key={thread.id} className="rounded border border-zinc-100 px-3 py-2">
                <p className="text-xs font-medium text-zinc-900">{thread.subject}</p>
                <p className="text-[11px] text-zinc-500">{thread.studentName} — L{thread.levelId}.{thread.lessonNumber}</p>
              </div>
            ))}
            {openThreads.length === 0 && <p className="text-xs text-zinc-400">No open threads</p>}
          </div>
        </article>
      </section>
    </div>
  );
}
