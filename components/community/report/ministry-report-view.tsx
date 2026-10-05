"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckIcon, PlusIcon, XIcon } from "lucide-react";

import {
  MINISTRY_COUNT_MAX,
  MINISTRY_FIELDS,
  MINISTRY_NOTE_MAX,
  totalReached,
  type ActivityLine,
  type MinistryFieldKey,
  type MinistryNumbers,
} from "@/lib/community/ministry-report";
import {
  CONTACTS_PER_DAY_MAX,
  CONTACT_NAME_MAX,
  CONTACT_NOTE_MAX,
  CONTACT_PHONE_MAX,
} from "@/lib/community/outreach-contacts";
import { dateKeyLabel } from "@/lib/community/time";
import type {
  DayActivitySummary,
  MemberReport,
} from "@/lib/db/queries/ministry-reports";
import type { OutreachContact } from "@/lib/db/queries/outreach-contacts";
import { saveMinistryReport } from "@/app/(site)/dashboard/community/_actions/report-actions";

import { ReportTabs } from "./report-tabs";

const card =
  "rounded-2xl border border-(--color-line-strong) bg-white shadow-(--shadow-sm)";

const personFieldClass =
  "h-11 w-full rounded-xl border border-zinc-200 px-3 text-base font-normal outline-none focus:border-zinc-300";

export type ReportHistoryDay = {
  dateKey: string;
  report: MemberReport | null;
  activity: DayActivitySummary | null;
};

/** One row of the "People you met" group. `id` is set once the person is saved. */
type PersonRow = {
  key: string;
  id: number | null;
  name: string;
  phone: string;
  note: string;
  /** Removing a person who has been followed up loses that record, so it asks first. */
  followedUp: boolean;
};

function blankRow(key: string): PersonRow {
  return { key, id: null, name: "", phone: "", note: "", followedUp: false };
}

/** The saved people as form rows, with one empty row to start from when there are none. */
function toRows(people: OutreachContact[]): PersonRow[] {
  if (people.length === 0) return [blankRow("blank")];
  return people.map((person) => ({
    key: `saved-${person.id}`,
    id: person.id,
    name: person.name,
    phone: person.phone ?? "",
    note: person.note ?? "",
    followedUp: person.followedUpAt !== null,
  }));
}

/** Where each kind of Pleros activity is done, so an empty line can be acted on. */
const ACTIVITY_LINKS: Record<ActivityLine["key"], string> = {
  bible: "/dashboard/prayer-watch",
  prayerWatch: "/dashboard/prayer-watch",
  sogp: "/dashboard/sogp",
  podcast: "/dashboard/podcast",
};

function dayName(dateKey: string, index: number): string {
  if (index === 0) return "Today";
  if (index === 1) return "Yesterday";
  return dateKeyLabel(dateKey);
}

function initialValues(report: MemberReport | null): Record<MinistryFieldKey, string> {
  const values = {} as Record<MinistryFieldKey, string>;
  for (const field of MINISTRY_FIELDS) {
    values[field.key] = report ? String(report[field.key]) : "";
  }
  return values;
}

function Totals({ title, totals }: { title: string; totals: MinistryNumbers }) {
  const figures = [
    { label: "Reached", value: totalReached(totals) },
    { label: "Saved", value: totals.saved },
    { label: "Filled", value: totals.filled },
    { label: "Healed", value: totals.healed },
    { label: "Follow-ups", value: totals.followUps },
  ];
  return (
    <div className={`${card} grid gap-2 p-4`}>
      <p className="text-xs font-medium text-zinc-500">{title}</p>
      <dl className="grid grid-cols-5 gap-2">
        {figures.map((figure) => (
          <div key={figure.label} className="grid gap-0.5">
            <dd className="ppc-heading text-base font-semibold text-zinc-900">
              {figure.value}
            </dd>
            <dt className="text-[0.7rem] text-zinc-500">{figure.label}</dt>
          </div>
        ))}
      </dl>
    </div>
  );
}

function Dot({ on, label }: { on: boolean; label: string }) {
  return (
    <span
      title={label}
      aria-label={`${label}: ${on ? "done" : "not recorded"}`}
      className={`inline-block size-2 rounded-full ${
        on ? "bg-(--color-brand-blue)" : "bg-zinc-200"
      }`}
    />
  );
}

/**
 * A member's daily ministry report: the form for the chosen day, what Pleros
 * already recorded for that day, and their recent history and totals.
 */
export function MinistryReportView({
  today,
  days,
  selected,
  report,
  activity,
  history,
  people,
  weekTotals,
  monthTotals,
}: {
  today: string;
  /** The days that can still be reported, today first. */
  days: string[];
  selected: string;
  report: MemberReport | null;
  activity: ActivityLine[];
  history: ReportHistoryDay[];
  /** The people already saved for the selected day. */
  people: OutreachContact[];
  weekTotals: MinistryNumbers;
  monthTotals: MinistryNumbers;
}) {
  const router = useRouter();
  const [values, setValues] = useState(() => initialValues(report));
  const [note, setNote] = useState(report?.note ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();
  const [rows, setRows] = useState(() => toRows(people));
  const addedRows = useRef(0);

  function addRow() {
    addedRows.current += 1;
    const key = `added-${addedRows.current}`;
    setRows((current) => [...current, blankRow(key)]);
  }

  function updateRow(key: string, change: Partial<PersonRow>) {
    setRows((current) =>
      current.map((row) => (row.key === key ? { ...row, ...change } : row)),
    );
  }

  function removeRow(row: PersonRow) {
    if (
      row.followedUp &&
      !window.confirm(
        `${row.name || "This person"} has been followed up. Remove them and that record when you save?`,
      )
    ) {
      return;
    }
    setRows((current) => current.filter((item) => item.key !== row.key));
  }

  function submit() {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      try {
        const result = await saveMinistryReport({
          dateKey: selected,
          values,
          note,
          people: rows.map(({ id, name, phone, note: personNote }) => ({
            id,
            name,
            phone,
            note: personNote,
          })),
        });
        if (!result.ok) {
          setError(result.error);
          return;
        }
        // Take the saved people back so every row now carries its id.
        setRows(toRows(result.people));
        setSaved(true);
        router.refresh();
      } catch {
        setError("Could not save your report. Try again.");
      }
    });
  }

  return (
    <div className="grid gap-4">
      <header className="grid gap-1">
        <h1 className="ppc-heading text-lg font-semibold text-zinc-900">
          Daily report
        </h1>
        <p className="max-w-md text-sm text-zinc-500">
          Record who you reached each day. The Pleros team, your pastor and your
          discipler can see your numbers; only the Pleros team and your pastor
          see your note.
        </p>
      </header>

      <ReportTabs active="report" />

      <nav
        aria-label="Choose a day"
        className="flex w-fit items-center gap-0.5 rounded-full border border-(--color-line-strong) bg-white p-0.5"
      >
        {days.map((dateKey, index) => {
          const active = dateKey === selected;
          return (
            <Link
              key={dateKey}
              href={
                dateKey === today
                  ? "/dashboard/community/report"
                  : `/dashboard/community/report?day=${dateKey}`
              }
              aria-current={active ? "page" : undefined}
              className={`inline-flex h-8 items-center rounded-full px-3.5 text-[13px] font-medium transition-colors ${
                active
                  ? "bg-(--color-brand-blue) text-white"
                  : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              {dayName(dateKey, index)}
            </Link>
          );
        })}
      </nav>

      <form
        className={`${card} grid gap-4 p-4 sm:p-5`}
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="ppc-heading text-sm font-semibold text-zinc-900">
            {dateKeyLabel(selected)}
          </h2>
          <p className="text-xs text-zinc-500">
            {report ? "Report sent. You can still correct it." : "Not sent yet."}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {MINISTRY_FIELDS.map((field) => (
            <label
              key={field.key}
              className="grid content-start gap-1 text-[13px] font-medium text-zinc-700"
            >
              <span>
                {field.label}
                {field.required ? " *" : ""}
              </span>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                max={MINISTRY_COUNT_MAX}
                step={1}
                required={field.required}
                value={values[field.key]}
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    [field.key]: event.target.value,
                  }))
                }
                placeholder="0"
                className="h-11 w-full rounded-xl border border-zinc-200 px-3 text-base font-normal outline-none focus:border-zinc-300"
              />
            </label>
          ))}
        </div>

        <fieldset className="grid gap-3 border-t border-zinc-100 pt-4">
          <legend className="sr-only">People you met</legend>
          <div className="grid gap-0.5">
            <p className="text-[13px] font-medium text-zinc-700">
              People you met (optional)
            </p>
            <p className="text-xs text-zinc-500">
              Add anyone you want to follow up. Only you, your pastor and the
              Pleros team see these names and numbers.
            </p>
          </div>

          {rows.map((row, index) => (
            <div
              key={row.key}
              className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-2 rounded-xl border border-zinc-200 p-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]"
            >
              <label className="order-1 grid gap-1 text-xs font-medium text-zinc-600">
                Name
                <input
                  value={row.name}
                  onChange={(event) => updateRow(row.key, { name: event.target.value })}
                  maxLength={CONTACT_NAME_MAX}
                  className={personFieldClass}
                />
              </label>
              <label className="order-3 col-span-2 grid gap-1 text-xs font-medium text-zinc-600 sm:order-2 sm:col-span-1">
                Phone number (optional)
                <input
                  type="tel"
                  inputMode="tel"
                  value={row.phone}
                  onChange={(event) => updateRow(row.key, { phone: event.target.value })}
                  maxLength={CONTACT_PHONE_MAX}
                  className={personFieldClass}
                />
              </label>
              <label className="order-4 col-span-2 grid gap-1 text-xs font-medium text-zinc-600">
                Note (optional)
                <input
                  value={row.note}
                  onChange={(event) => updateRow(row.key, { note: event.target.value })}
                  maxLength={CONTACT_NOTE_MAX}
                  placeholder="Where you met, what to follow up on…"
                  className={personFieldClass}
                />
              </label>
              {/* Last in the markup so it follows the fields when tabbing; placed beside them by `order`. */}
              <button
                type="button"
                onClick={() => removeRow(row)}
                aria-label={`Remove person ${index + 1}`}
                className="order-2 inline-flex size-11 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 sm:order-3"
              >
                <XIcon className="size-4" strokeWidth={2} />
              </button>
            </div>
          ))}

          {rows.length < CONTACTS_PER_DAY_MAX ? (
            <button
              type="button"
              onClick={addRow}
              className="inline-flex h-9 w-fit items-center gap-1.5 rounded-full border border-(--color-brand-blue) px-4 text-[13px] font-semibold text-(--color-brand-blue)"
            >
              <PlusIcon className="size-4" strokeWidth={2} />
              {rows.length === 0 ? "Add a person" : "Add another person"}
            </button>
          ) : null}
        </fieldset>

        <label className="grid gap-1 text-[13px] font-medium text-zinc-700">
          Anything else you did (optional)
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            rows={3}
            maxLength={MINISTRY_NOTE_MAX}
            placeholder="Visits, outreach, other tasks…"
            className="w-full resize-none rounded-xl border border-zinc-200 px-3 py-2.5 text-base font-normal leading-relaxed outline-none focus:border-zinc-300"
          />
        </label>

        {error ? (
          <p role="alert" className="text-[13px] text-red-700">
            {error}
          </p>
        ) : null}

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={pending}
            className="inline-flex h-10 items-center rounded-full bg-(--color-brand-blue) px-5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {pending ? "Saving…" : report ? "Update report" : "Send report"}
          </button>
          {saved ? (
            <p
              role="status"
              className="inline-flex items-center gap-1 text-[13px] font-medium text-emerald-700"
            >
              <CheckIcon className="size-4" strokeWidth={2} /> Saved
            </p>
          ) : null}
        </div>
      </form>

      <section className={`${card} overflow-hidden`}>
        <div className="border-b border-zinc-100 px-4 py-3">
          <h2 className="ppc-heading text-sm font-semibold text-zinc-900">
            Your Pleros activity
          </h2>
          <p className="mt-0.5 text-xs text-zinc-500">
            For {dateKeyLabel(selected)}, taken from what you have already
            logged. You do not need to enter it again.
          </p>
        </div>
        <ul className="divide-y divide-zinc-100">
          {activity.map((line) => (
            <li
              key={line.key}
              className="flex items-center justify-between gap-3 px-4 py-3 text-sm"
            >
              <span className="grid min-w-0">
                <span className="font-medium text-zinc-900">{line.label}</span>
                <span
                  className={`text-xs ${
                    line.detail ? "text-zinc-600" : "text-zinc-400"
                  }`}
                >
                  {line.detail ?? "Nothing recorded"}
                </span>
              </span>
              {line.detail ? (
                <CheckIcon
                  className="size-4 shrink-0 text-emerald-600"
                  strokeWidth={2.5}
                />
              ) : (
                <Link
                  href={ACTIVITY_LINKS[line.key]}
                  className="shrink-0 text-[13px] font-medium text-(--color-brand-blue) underline underline-offset-2"
                >
                  Open
                </Link>
              )}
            </li>
          ))}
        </ul>
      </section>

      <div className="grid gap-3 sm:grid-cols-2">
        <Totals title="Last 7 days" totals={weekTotals} />
        <Totals title="This month" totals={monthTotals} />
      </div>

      <section className={`${card} overflow-hidden`}>
        <h2 className="ppc-heading border-b border-zinc-100 px-4 py-3 text-sm font-semibold text-zinc-900">
          Your last {history.length} days
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead className="text-xs text-zinc-500">
              <tr>
                <th className="px-4 py-2 font-medium">Day</th>
                {MINISTRY_FIELDS.map((field) => (
                  <th key={field.key} className="px-2 py-2 text-right font-medium">
                    {field.short}
                  </th>
                ))}
                <th className="px-4 py-2 font-medium">Pleros</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {history.map((day) => (
                <tr key={day.dateKey}>
                  <td className="whitespace-nowrap px-4 py-2 font-medium text-zinc-900">
                    {dateKeyLabel(day.dateKey)}
                  </td>
                  {MINISTRY_FIELDS.map((field) => (
                    <td
                      key={field.key}
                      className="px-2 py-2 text-right tabular-nums text-zinc-700"
                    >
                      {day.report ? day.report[field.key] : "–"}
                    </td>
                  ))}
                  <td className="px-4 py-2">
                    <span className="flex items-center gap-1.5">
                      <Dot on={day.activity?.bible ?? false} label="Bible reading" />
                      <Dot
                        on={day.activity?.prayerWatch ?? false}
                        label="Prayer Watch"
                      />
                      {day.activity?.sogp == null ? null : (
                        <Dot on={day.activity.sogp} label="SOGP" />
                      )}
                      <Dot
                        on={(day.activity?.podcastEpisodes ?? 0) > 0}
                        label="Podcast"
                      />
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="border-t border-zinc-100 px-4 py-2 text-xs text-zinc-500">
          Dots show Bible reading, Prayer Watch, SOGP (when you are in a cohort)
          and podcast for each day.
        </p>
      </section>
    </div>
  );
}
