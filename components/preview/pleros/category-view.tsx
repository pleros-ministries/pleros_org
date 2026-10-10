"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeftIcon, CheckIcon, LockIcon, PencilIcon, Trash2Icon } from "lucide-react";

import { activityKindConfig, type ActivityKind } from "@/lib/community/ministry-activities";
import { cn } from "@/lib/utils";
import {
  MEETING_KINDS,
  MINISTRY_KINDS,
  REPORT_CATEGORIES,
  activitiesFor,
  categoryStatus,
  declarationFor,
  devotionFor,
  isWritableDay,
  recordedLines,
} from "@/lib/preview/pleros/daily-report";
import { findPerson } from "@/lib/preview/pleros/scope";
import {
  clearDeclaration,
  confirmDevotional,
  declareNil,
  removeActivity,
} from "@/lib/preview/pleros/store";
import { activityLines, type ActivityLine } from "@/lib/community/ministry-report";
import type { ReportCategory } from "@/lib/preview/pleros/types";

import { ActivityEntry, forDay } from "./activity-entry";
import { useDemo } from "./demo-context";
import { CATEGORY_ICONS, MINISTRY_ICONS, SOURCE_ICONS, activityLine, orderedLines } from "./report-parts";
import { SourceSheet } from "./source-sheet";
import {
  PageHeader,
  StatusPill,
  buttonPrimary,
  buttonQuiet,
  buttonSecondary,
  buttonSmall,
  focusRing,
  longDate,
  panel,
} from "./ui";

export function CategoryView({ category }: { category: ReportCategory }) {
  const { state, viewer, day, today, href } = useDemo();
  const config = REPORT_CATEGORIES.find((item) => item.key === category)!;
  const status = categoryStatus(state, viewer.id, day, category);
  const writable = isWritableDay(day, today);

  return (
    <div className="grid gap-6">
      <Link
        href={href("reports")}
        className={cn("inline-flex w-fit items-center gap-1.5 rounded-full text-[13px] font-medium text-(--color-brand-blue)", focusRing)}
      >
        <ArrowLeftIcon className="size-4" aria-hidden />
        Daily reports
      </Link>
      <PageHeader
        eyebrow={longDate(day)}
        title={config.label}
        actions={<StatusPill status={status} />}
      />
      {!writable ? (
        <p className="flex items-start gap-2 text-[13px] text-(--color-text-muted)">
          <LockIcon className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          View only.
        </p>
      ) : null}
      {category === "devotional" ? <DevotionalReport writable={writable} /> : <ActivityCategory category={category} writable={writable} />}
    </div>
  );
}

// ─── Devotional ────────────────────────────────────────────────────────────

function DevotionalReport({ writable }: { writable: boolean }) {
  const { state, viewer, day, today, run, href } = useDemo();
  const router = useRouter();
  const [source, setSource] = useState<ActivityLine["key"] | null>(null);
  const record = devotionFor(state, viewer.id, day);
  // The live wording for each source: one line each, SOGP only for cohort members.
  const lines = orderedLines(activityLines(record));
  const recordedCount = recordedLines(record).length;
  const confirmed = declarationFor(state, viewer.id, day, "devotional") === "confirmed";
  const person = findPerson(state, viewer.id)!;

  function confirm() {
    const outcome = run((current) => confirmDevotional(current, viewer.id, day));
    if (outcome.ok) router.push(href("reports"));
  }

  return (
    <>
      <section aria-labelledby="sources" className={cn(panel, "overflow-hidden")}>
        <div className="border-b border-(--color-line) px-4 py-3.5 sm:px-5">
          <h2 id="sources" className="text-[15px] font-medium text-(--color-text-strong)">
            Devotional activity
          </h2>
          
        </div>
        <ul className="divide-y divide-(--color-line)">
          {lines.map((line) => {
            const Icon = SOURCE_ICONS[line.key];
            return (
              <li key={line.key} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3.5 sm:px-5">
                <span
                  className={cn(
                    "grid size-10 shrink-0 place-items-center rounded-xl",
                    line.detail ? "bg-(--color-brand-sky) text-(--color-brand-blue)" : "bg-(--color-surface-muted) text-(--color-text-muted)",
                  )}
                >
                  <Icon className="size-[18px]" strokeWidth={1.75} aria-hidden />
                </span>
                <div className="grid min-w-0 flex-1 gap-0.5">
                  <p className="text-[14.5px] font-medium text-(--color-text-strong)">{line.label}</p>
                  <p className={cn("text-[13px]", line.detail ? "text-(--color-text)" : "text-(--color-text-muted)")}>
                    {line.detail ? (
                      <>
                        <CheckIcon className="mr-1 inline size-3.5 text-(--color-brand-blue)" strokeWidth={2.5} aria-hidden />
                        {line.detail}
                      </>
                    ) : (
                      "Not recorded"
                    )}
                    <span className="text-(--color-text-muted)"></span>
                  </p>
                </div>
                {writable ? (
                  <button type="button" onClick={() => setSource(line.key)} className={buttonSmall}>
                    <PencilIcon className="size-3.5" aria-hidden />
                    Edit
                  </button>
                ) : null}
              </li>
            );
          })}
          {!person.inCohort ? (
            <li className="flex items-center gap-4 px-4 py-3.5 sm:px-5">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-(--color-surface-muted) text-(--color-text-muted)">
                <SOURCE_ICONS.sogp className="size-[18px]" strokeWidth={1.75} aria-hidden />
              </span>
              <div className="grid gap-0.5">
                <p className="text-[14.5px] font-medium text-(--color-text-strong)">SOGP</p>
                <p className="text-[13px] text-(--color-text-muted)">Not in this cohort</p>
              </div>
            </li>
          ) : null}
        </ul>
      </section>

      <section aria-labelledby="confirm-devotion" className={cn(panel, "grid gap-3 px-4 py-4 sm:px-5")}>
        <h2 id="confirm-devotion" className="text-[15px] font-medium text-(--color-text-strong)">
          {confirmed ? "Devotional report confirmed" : "Confirm your devotional report"}
        </h2>
        {confirmed ? (
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-[13.5px] text-(--color-text)">
              {recordedCount > 0
                ? `Reported with ${recordedCount} devotional ${recordedCount === 1 ? "activity" : "activities"} recorded for ${forDay(day, today)}.`
                : `Reported as nil for ${forDay(day, today)}.`}
            </p>
            {writable ? (
              <button
                type="button"
                className={buttonQuiet}
                onClick={() => run((current) => clearDeclaration(current, viewer.id, day, "devotional"))}
              >
                Undo
              </button>
            ) : null}
          </div>
        ) : (
          <>
            <p className="text-[13.5px] text-(--color-text-muted)">
              {recordedCount > 0
                ? ""
                : "Nothing recorded"}
            </p>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={confirm} disabled={!writable} className={buttonPrimary}>
                {recordedCount > 0 ? "Confirm devotional report" : "Confirm nothing recorded"}
              </button>
            </div>
          </>
        )}
        
      </section>

      <SourceSheet source={source} dateKey={day} record={record} onClose={() => setSource(null)} />
    </>
  );
}

// ─── Ministry and meetings ────────────────────────────────────────────────

function ActivityCategory({
  category,
  writable,
}: {
  category: Exclude<ReportCategory, "devotional">;
  writable: boolean;
}) {
  const { state, viewer, day, today, run, href } = useDemo();
  const router = useRouter();
  const searchParams = useSearchParams();
  const choicesRef = useRef<HTMLHeadingElement>(null);
  const kinds = category === "ministry" ? MINISTRY_KINDS : MEETING_KINDS;
  const rows = activitiesFor(state, viewer.id, day, category);
  const nil = declarationFor(state, viewer.id, day, category) === "nil";

  const requestedKind = searchParams.get("kind");
  const editId = Number(searchParams.get("edit"));
  const editing = editId ? rows.find((row) => row.id === editId) : undefined;
  const kind = editing?.kind ?? (kinds.find((item) => item === requestedKind) as ActivityKind | undefined);
  const showForm = writable && Boolean(kind);
  const returning = searchParams.get("from") === "form";

  useEffect(() => {
    if (!showForm && returning) choicesRef.current?.focus();
  }, [showForm, returning]);

  const base = `reports/${category}`;
  const open = (next: ActivityKind) => router.push(href(base, { kind: next }), { scroll: false });
  const back = () => router.push(href(base, { from: "form" }), { scroll: false });

  if (showForm && kind) {
    return (
      <ActivityEntry
        key={`${kind}-${editing?.id ?? "new"}`}
        kind={kind}
        existing={editing}
        onBack={back}
        onSaved={() => router.push(href("reports"))}
      />
    );
  }

  const Icon = CATEGORY_ICONS[category];
  const nilLabel = category === "meetings" ? "No meeting" : "No ministry activity";

  return (
    <>
      <section aria-labelledby="choose-kind" className="grid gap-3">
        <h2
          id="choose-kind"
          ref={choicesRef}
          tabIndex={-1}
          className="text-[15px] font-medium text-(--color-text-strong) outline-none"
        >
          {category === "ministry" ? "What did you do?" : "Which meeting?"}
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {kinds.map((item) => {
            const kindConfig = activityKindConfig(item);
            const KindIcon = item === "outreach" || item === "follow_up" ? MINISTRY_ICONS[item] : Icon;
            return (
              <button
                key={item}
                type="button"
                disabled={!writable}
                onClick={() => open(item)}
                className={cn(
                  panel,
                  "group flex items-start gap-3.5 px-4 py-4 text-left transition-[border-color,box-shadow,transform] duration-150 hover:border-(--color-brand-blue) hover:shadow-[0_0_0_1px_var(--color-brand-blue)] active:translate-y-px disabled:pointer-events-none disabled:opacity-50",
                  focusRing,
                )}
              >
                <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-(--color-brand-sky-soft) text-(--color-brand-blue) transition-colors group-hover:bg-(--color-brand-sky)">
                  <KindIcon className="size-5" strokeWidth={1.75} aria-hidden />
                </span>
                <span className="grid gap-0.5">
                  <span className="text-[15.5px] font-medium text-(--color-text-strong)">{kindConfig.label}</span>
                  
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section aria-labelledby="logged" className={cn(panel, "overflow-hidden")}>
        <div className="flex items-center justify-between gap-3 border-b border-(--color-line) px-4 py-3.5 sm:px-5">
          <h2 id="logged" className="text-[15px] font-medium text-(--color-text-strong)">
            Logged for {forDay(day, today)}
          </h2>
          <StatusPill status={categoryStatus(state, viewer.id, day, category)} />
        </div>
        {rows.length > 0 ? (
          <ul className="divide-y divide-(--color-line)">
            {rows.map((row) => {
              const line = activityLine(row);
              return (
                <li key={row.id} className="flex flex-wrap items-center gap-3 px-4 py-3.5 sm:px-5">
                  <div className="grid min-w-0 flex-1 gap-0.5">
                    <p className="text-[14px] font-medium text-(--color-text-strong)">{line.title}</p>
                    <p className="text-[12.5px] text-(--color-text-muted)">{line.detail}</p>
                  </div>
                  {writable ? (
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        className={buttonSmall}
                        onClick={() => router.push(href(base, { edit: String(row.id) }), { scroll: false })}
                      >
                        <PencilIcon className="size-3.5" aria-hidden />
                        Edit
                      </button>
                      <button
                        type="button"
                        className={buttonSmall}
                        aria-label={`Remove ${line.title}`}
                        onClick={() => {
                          if (window.confirm(`Remove ${line.title}? People you met stay on your list.`)) {
                            run((current) => removeActivity(current, viewer.id, row.id));
                          }
                        }}
                      >
                        <Trash2Icon className="size-3.5" aria-hidden />
                      </button>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="grid gap-3 px-4 py-5 sm:px-5">
            {nil ? (
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-[13.5px] text-(--color-text)">
                  {nilLabel} · {forDay(day, today)}
                </p>
                {writable ? (
                  <button
                    type="button"
                    className={buttonQuiet}
                    onClick={() => run((current) => clearDeclaration(current, viewer.id, day, category))}
                  >
                    Undo
                  </button>
                ) : null}
              </div>
            ) : (
              <>
                
                {writable ? (
                  <button
                    type="button"
                    className={cn(buttonSecondary, "w-fit")}
                    onClick={() => {
                      const outcome = run((current) => declareNil(current, viewer.id, day, category));
                      if (outcome.ok) router.push(href("reports"));
                    }}
                  >
                    {nilLabel} {forDay(day, today) === "today" ? "today" : `on ${forDay(day, today)}`}
                  </button>
                ) : null}
              </>
            )}
          </div>
        )}
      </section>

      
    </>
  );
}
