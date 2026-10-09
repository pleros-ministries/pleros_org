import Link from "next/link";
import { AwardIcon } from "lucide-react";

import type {
  SogpJourneyData,
  SogpJourneyWeekCertificate,
} from "@/lib/db/queries/sogp-journey";
import { describeSogpWeekGap } from "@/lib/sogp/week-certificates";

export const SOGP_CERTIFICATES_HREF = "/dashboard/sogp/certificate";

const shortDate = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  timeZone: "Africa/Lagos",
});

/** "21 Sept", from an ISO instant or a Lagos date key. */
export function formatCertificateShortDate(value: string) {
  const date = /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? new Date(`${value}T12:00:00Z`)
    : new Date(value);
  return shortDate.format(date);
}

export function describeWeekCertificateStatus(
  week: SogpJourneyWeekCertificate,
  todayKey: string,
) {
  if (week.certificate) return `Earned ${formatCertificateShortDate(week.certificate.issuedAt)}`;
  if (week.revoked) return "Withdrawn. Contact the SOGP team.";
  if (week.startDateKey && week.startDateKey > todayKey) {
    return `Opens ${formatCertificateShortDate(week.startDateKey)}`;
  }
  if (week.eligible) return "Your certificate is on its way";
  return describeSogpWeekGap(week) || "In progress";
}

function WeekMarker({ week, earned }: { week: number; earned: boolean }) {
  return earned ? (
    <span className="grid size-7 shrink-0 place-items-center rounded-full bg-[var(--color-brand-lime)]">
      <AwardIcon className="size-3.5 text-[var(--color-brand-blue)]" strokeWidth={2.2} />
    </span>
  ) : (
    <span className="grid size-7 shrink-0 place-items-center rounded-full bg-zinc-100 text-[0.65rem] font-semibold text-zinc-500">
      {week}
    </span>
  );
}

/** The learner's week certificates, then the final one, on the SOGP dashboard. */
export function SogpCertificatesCard({
  data,
  preview = false,
}: {
  data: SogpJourneyData;
  preview?: boolean;
}) {
  const { weeks, final } = data.certificates;
  const earned = weeks.filter((week) => week.certificate).length;
  const linkClass = "shrink-0 text-xs font-semibold text-[var(--color-brand-blue)]";

  return (
    <div className="grid gap-2 rounded-[var(--radius-md)] bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h3 className="ppc-heading text-sm font-semibold text-zinc-900">Certificates</h3>
        <span className="text-xs text-zinc-500">
          {earned} of {weeks.length} weeks
        </span>
      </div>
      <ul className="grid divide-y divide-zinc-100">
        {weeks.map((week) => (
          <li key={week.week} className="flex items-center gap-3 py-2.5">
            <WeekMarker week={week.week} earned={Boolean(week.certificate)} />
            <span className="grid min-w-0 flex-1 gap-0.5">
              <span className="ppc-heading text-xs font-semibold text-zinc-900">
                Week {week.week} certificate
              </span>
              <span className="text-[0.7rem] leading-[1.4] text-zinc-500">
                {describeWeekCertificateStatus(week, data.todayKey)}
              </span>
            </span>
            {week.certificate && !preview ? (
              <Link href={SOGP_CERTIFICATES_HREF} className={linkClass}>
                View
              </Link>
            ) : null}
          </li>
        ))}
        <li className="flex items-center gap-3 py-2.5">
          {final ? (
            <WeekMarker week={0} earned />
          ) : (
            <span className="grid size-7 shrink-0 place-items-center rounded-full bg-zinc-100">
              <AwardIcon className="size-3.5 text-zinc-400" strokeWidth={2.2} />
            </span>
          )}
          <span className="grid min-w-0 flex-1 gap-0.5">
            <span className="ppc-heading text-xs font-semibold text-zinc-900">
              Final certificate
            </span>
            <span className="text-[0.7rem] leading-[1.4] text-zinc-500">
              {final
                ? `Issued ${formatCertificateShortDate(final.issuedAt)}`
                : "Issued after the course"}
            </span>
          </span>
          {final && !preview ? (
            <a
              href={`/api/sogp/certificate/${encodeURIComponent(final.verificationCode)}`}
              className={linkClass}
            >
              Download
            </a>
          ) : null}
        </li>
      </ul>
      {preview ? null : (
        <Link
          href={SOGP_CERTIFICATES_HREF}
          className="w-fit text-xs font-semibold text-[var(--color-brand-blue)] underline underline-offset-4"
        >
          All certificates
        </Link>
      )}
    </div>
  );
}
