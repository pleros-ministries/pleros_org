import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";

import { EnrolleeDailyPerformance } from "@/components/ppc/enrollee-daily-performance";
import { PageHeader } from "@/components/ppc/page-header";
import { requireAdmin } from "@/lib/auth/require-role";
import { getSogpEnrolleePerformance } from "@/lib/db/queries/sogp-daily";
import { listSogpWeekCertificatesForEnrollment } from "@/lib/db/queries/sogp-week-certificates";
import { SOGP_CERTIFICATE_WEEKS } from "@/lib/sogp/week-certificates";
import { STUDENT_STATUS_META } from "@/lib/sogp/student-status";

const certificateDate = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "Africa/Lagos",
});

export default async function AdminSogpEnrolleePage({
  params,
}: {
  params: Promise<{ enrollmentId: string }>;
}) {
  await requireAdmin();

  const { enrollmentId: raw } = await params;
  const enrollmentId = Number(raw);
  if (!Number.isInteger(enrollmentId)) notFound();

  const [performance, weekCertificates] = await Promise.all([
    getSogpEnrolleePerformance(enrollmentId),
    listSogpWeekCertificatesForEnrollment(enrollmentId),
  ]);
  if (!performance) notFound();

  const { enrollee, status, days, todayKey } = performance;
  const statusMeta = STUDENT_STATUS_META[status];

  return (
    <div className="grid gap-4">
      <Link
        href="/admin/sogp?tab=enrolments"
        className="inline-flex w-fit items-center gap-1 text-xs font-medium text-zinc-500 hover:text-zinc-900"
      >
        <ChevronLeft className="size-3.5" />
        Enrolments
      </Link>

      <PageHeader title={enrollee.name} description={enrollee.email}>
        <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-[0.7rem] font-semibold text-zinc-700">
          {statusMeta.emoji} {statusMeta.label}
        </span>
      </PageHeader>

      <section className="grid gap-1 rounded-sm border border-zinc-200 bg-white p-4 text-xs text-zinc-600">
        <p>
          {enrollee.phone} · {enrollee.region ? `${enrollee.region}, ` : ""}
          {enrollee.country}
          {enrollee.birthYear ? ` · Born ${enrollee.birthYear}` : ""}
        </p>
        <p>
          {enrollee.cohortTitle} · {enrollee.enrollmentStatus.replaceAll("_", " ")} · Pastor:{" "}
          {enrollee.pastorName ?? "Unassigned"}
        </p>
        <p>
          {enrollee.leaderboardAlias ? `Leaderboard: ${enrollee.leaderboardAlias} · ` : ""}
          WhatsApp: {enrollee.whatsappConsent ? "Opted in" : "Not opted in"}
          {enrollee.referralSource
            ? ` · Heard via ${enrollee.referralSource.replaceAll("_", " ")}`
            : ""}
        </p>
      </section>

      <section className="grid gap-2 rounded-sm border border-zinc-200 bg-white p-4 text-xs">
        <h2 className="ppc-heading text-sm font-semibold text-zinc-900">Week certificates</h2>
        <ul className="grid gap-1 text-zinc-600 sm:grid-cols-2">
          {SOGP_CERTIFICATE_WEEKS.map((week) => {
            const certificate = weekCertificates.find((item) => item.week === week);
            return (
              <li key={week} className="flex justify-between gap-3">
                <span className="font-medium text-zinc-900">Week {week}</span>
                <span>
                  {!certificate
                    ? "Not yet"
                    : certificate.revokedAt
                      ? "Withdrawn"
                      : `Issued ${certificateDate.format(certificate.issuedAt)}`}
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      <EnrolleeDailyPerformance days={days} todayKey={todayKey} />
    </div>
  );
}
