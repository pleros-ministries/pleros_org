"use client";

import Link from "next/link";
import { BookOpenIcon, ChurchIcon, GlobeIcon, HandHeartIcon, MapPinIcon, MegaphoneIcon, UsersIcon } from "lucide-react";

import { totalReached } from "@/lib/community/ministry-report";
import { fcchurchAboutSection, fcchurchLocations, fcchurchOnlineSection, fcchurchPageHero } from "@/lib/fcchurch-page-content";
import { partnerGivingSection, partnerImpactItems, partnerPageHero, partnerReasons } from "@/lib/partner-page-content";
import { shiftDate } from "@/lib/sogp/daily-date";
import { cn } from "@/lib/utils";
import { dayReport, isWritableDay, recordedLines } from "@/lib/preview/pleros/daily-report";

import { useDemo } from "../demo-context";
import { OverallPill, PageHeader, ReportMark, StatStrip, buttonPrimary, buttonSecondary, focusRing, panel, relativeDay } from "../ui";
import { ExternalLink, IconChip, ListPanel, Row, Section } from "./parts";

const HISTORY_DAYS = 14;

export function ReportHistoryDestination() {
  const { state, viewer, today, href } = useDemo();
  const days = Array.from({ length: HISTORY_DAYS }, (_, index) => shiftDate(today, -index));
  const reports = days.map((dateKey) => dayReport(state, viewer.id, dateKey));
  const complete = reports.filter((report) => report.overall === "complete").length;
  const activities = reports.reduce((sum, report) => sum + report.ministry.length + report.meetings.length, 0);
  const reached = reports.reduce((sum, report) => sum + totalReached(report.numbers), 0);

  return (
    <div className="grid gap-6">
      <PageHeader eyebrow={`Last ${HISTORY_DAYS} days`} title="Report history" actions={<Link href={href("reports", { day: null })} className={buttonPrimary}>Today&apos;s report</Link>} />
      <StatStrip
        items={[
          { label: "Complete days", value: complete, detail: `of ${HISTORY_DAYS}` },
          { label: "Activities", value: activities },
          { label: "People reached", value: reached },
          { label: "Devotional days", value: reports.filter((report) => recordedLines(report.devotion).length > 0).length },
        ]}
      />
      <ol className={cn(panel, "divide-y divide-(--color-line) overflow-hidden")}>
        {reports.map((report) => (
          <li key={report.dateKey}>
            <Link href={href("reports", { day: report.dateKey })} className={cn("grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 px-4 py-3 transition-colors hover:bg-(--color-brand-sky-soft) sm:grid-cols-[140px_minmax(0,1fr)_auto_auto] sm:px-5", focusRing)}>
              <span className="text-[13.5px] font-medium text-(--color-text-strong)">{relativeDay(report.dateKey, today)}</span>
              <span className="order-3 col-span-2 truncate text-[12.5px] text-(--color-text-muted) sm:order-none sm:col-span-1">
                {report.ministry.length + report.meetings.length} activities · {recordedLines(report.devotion).length} devotional · {isWritableDay(report.dateKey, today) ? "Editable" : "View only"}
              </span>
              <ReportMark statuses={[report.statuses.devotional, report.statuses.ministry, report.statuses.meetings]} className="max-sm:hidden" />
              <OverallPill status={report.overall} />
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}

const REASON_ICONS = [MegaphoneIcon, UsersIcon, GlobeIcon];

export function PartnershipDestination() {
  return (
    <div className="grid gap-6">
      <PageHeader eyebrow={partnerPageHero.description} title="Partnership" />
      <p className="max-w-[60ch] text-[14px] leading-relaxed text-(--color-text)">{partnerPageHero.intro}</p>
      <Section title="Why partner">
        <ListPanel>
          {partnerReasons.map((reason, index) => (
            <Row key={reason.step} icon={REASON_ICONS[index] ?? HandHeartIcon} title={reason.title} detail={reason.description} />
          ))}
        </ListPanel>
      </Section>
      <Section title="Your giving supports">
        <ul className="flex flex-wrap gap-2">
          {partnerImpactItems.map((item) => (
            <li key={item} className="rounded-full bg-(--color-brand-sky-soft) px-3 py-1.5 text-[12.5px] font-medium text-(--color-brand-blue)">{item}</li>
          ))}
        </ul>
      </Section>
      <Section title={partnerGivingSection.title}>
        <div className={cn(panel, "flex flex-wrap items-center gap-3 p-4 sm:p-5")}>
          <IconChip icon={HandHeartIcon} />
          <p className="min-w-0 flex-1 text-[13px] leading-relaxed text-(--color-text-muted)">{partnerGivingSection.description}</p>
          <Link href="/partner" className={buttonPrimary}>{partnerPageHero.ctaLabel}</Link>
        </div>
      </Section>
    </div>
  );
}

export function ChurchDestination() {
  return (
    <div className="grid gap-6">
      <PageHeader eyebrow="Our church ministry" title={fcchurchPageHero.title} description={fcchurchPageHero.description} />
      <Section title={fcchurchAboutSection.title}>
        <p className="max-w-[60ch] text-[13.5px] leading-relaxed text-(--color-text)">{fcchurchAboutSection.description}</p>
      </Section>
      <Section title="Locations" detail={`${fcchurchLocations.length} cities`}>
        <div className="grid gap-3 sm:grid-cols-2">
          {fcchurchLocations.map((location) => (
            <article key={location.id} className={cn(panel, "grid content-start gap-3 p-4")}>
              <div className="flex items-center gap-3">
                <IconChip icon={MapPinIcon} />
                <div className="grid min-w-0">
                  <h3 className="text-[14px] font-medium text-(--color-text-strong)">{location.city}, {location.state}</h3>
                  <p className="truncate text-[12px] text-(--color-text-muted)">{location.venueName}</p>
                </div>
              </div>
              <ul className="grid gap-1.5">
                {location.schedule.map((entry) => (
                  <li key={entry.label} className="flex items-baseline justify-between gap-3 text-[12.5px]">
                    <span className="text-(--color-text-strong)">{entry.label}</span>
                    <span className="text-right text-(--color-text-muted)">{entry.time}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </Section>
      <Section title={fcchurchOnlineSection.title}>
        <div className={cn(panel, "flex flex-wrap items-center gap-3 p-4 sm:p-5")}>
          <IconChip icon={ChurchIcon} />
          <p className="min-w-0 flex-1 text-[13px] leading-relaxed text-(--color-text-muted)">{fcchurchOnlineSection.description}</p>
          <ExternalLink href={fcchurchOnlineSection.streamHref}>{fcchurchOnlineSection.streamLabel}</ExternalLink>
        </div>
      </Section>
      <div className="flex flex-wrap gap-2">
        <Link href="/fcc" className={buttonSecondary}><BookOpenIcon className="size-3.5" aria-hidden />Visit the church page</Link>
      </div>
    </div>
  );
}
