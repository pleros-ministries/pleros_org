"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  ArrowLeftIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  HandHelpingIcon,
  HeartHandshakeIcon,
  LinkIcon,
  MessageCircleIcon,
  MessageCircleQuestionIcon,
  UsersIcon,
} from "lucide-react";
import Link from "next/link";
import { Fragment, useState } from "react";

import {
  getDiscipleParticipationAction,
  leaveDiscipleshipGroupAction,
  logWhatsAppContactAction,
  regenerateInviteLinkAction,
  removeDiscipleAction,
  setDiscipleSharesPhoneAction,
  setLeaderSharesPhoneAction,
} from "@/app/(site)/dashboard/sogp/discipleship/_actions";
import { Mark } from "@/components/ppc/admin-sogp-daily-by-pastor";
import { DetailGrid, ExpandButton } from "@/components/ppc/expandable-table-row";
import { ProgressBar } from "@/components/ppc/progress-bar";
import type {
  DiscipleDayParticipation,
  DiscipleSummary,
  DiscipleshipDashboardData,
} from "@/lib/db/queries/sogp-discipleship";
import { clampDate, lagosToday, shiftDate } from "@/lib/sogp/daily-date";
import {
  DISCIPLESHIP_GROUP_MAX,
  buildDiscipleshipShareMessage,
} from "@/lib/sogp/discipleship";
import {
  buildPreSogpShareIntentUrl,
  type PreSogpShareIntentPlatform,
} from "@/lib/sogp/share";
import type { StudentStatus } from "@/lib/sogp/student-status";

import {
  DisciplePromptList,
  LeaderPromptList,
  PromptComposer,
  formatDiscipleshipDate,
  useDiscipleshipAction,
} from "./discipleship-check-ins";
import { DiscipleFollowUp, LastContactLine } from "./discipleship-nudge";
import { DisciplePrayerSection, LeaderPrayerList } from "./discipleship-prayer";
import { ShareIntentButtons } from "./share-intent-buttons";
import { SogpActivitySection } from "./sogp-activity-section";

const PLATFORMS: PreSogpShareIntentPlatform[] = ["whatsapp", "facebook", "x", "telegram"];

/** Sentence-case labels and state colours for the shared status classifier. */
const STATUS_DISPLAY: Record<StudentStatus, { label: string; className: string }> = {
  on_track: { label: "On track", className: "bg-emerald-50 text-emerald-700" },
  day_inconsistent: { label: "Missing some days", className: "bg-amber-50 text-amber-700" },
  activity_inconsistent: { label: "Missing some activities", className: "bg-amber-50 text-amber-700" },
  generally_inconsistent: { label: "Inconsistent", className: "bg-orange-50 text-orange-700" },
  declining: { label: "Slowing down", className: "bg-orange-50 text-orange-700" },
  at_risk: { label: "At risk", className: "bg-red-50 text-red-700" },
  unresponsive: { label: "Not active", className: "bg-zinc-100 text-zinc-600" },
};

const iconClass = "size-4 text-[var(--color-brand-blue)]";
const quietButtonClass =
  "text-xs font-medium text-[var(--color-brand-blue)] underline-offset-4 hover:underline disabled:opacity-60";
const whatsappButtonClass =
  "inline-flex min-h-8 items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 text-xs font-medium text-emerald-800 transition-transform duration-150 active:scale-[0.98]";

export function DiscipleshipPage({
  data,
  preview = false,
}: {
  data: DiscipleshipDashboardData;
  preview?: boolean;
}) {
  const { myGroup, myDiscipler } = data;
  const archived = myGroup.status === "archived";

  return (
    <section className="site-font-theme min-h-screen bg-[#f6f5f1] pb-16 text-zinc-900">
      <nav
        aria-label="SOGP dashboard navigation"
        className="sticky top-0 z-30 border-b border-[var(--color-brand-blue)] bg-[var(--color-brand-blue)] shadow-sm"
      >
        <div className="site-shell-page sogp-shell-page flex min-h-12 items-center justify-between gap-4">
          <Link
            href={preview ? "/preview/dashboard" : "/dashboard/sogp"}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-sm px-1 text-xs font-medium text-white/85 transition-colors duration-150 hover:text-white focus-visible:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white active:scale-[0.98]"
          >
            <ArrowLeftIcon className="size-3.5" strokeWidth={2} /> Dashboard
          </Link>
          <span className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-[var(--color-brand-lime)]">
            SOGP
          </span>
        </div>
      </nav>

      <div className="site-shell-page sogp-shell-page grid gap-4 pb-6 pt-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-start">
        <header className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 lg:col-span-2">
          <h1 className="ppc-heading text-lg font-semibold text-zinc-900">Discipleship</h1>
          <p className="text-[0.62rem] font-semibold uppercase tracking-[0.1em] text-zinc-400">
            {myGroup.disciples.length} of {DISCIPLESHIP_GROUP_MAX} disciples
          </p>
        </header>

        <div className="grid gap-4">
          {myDiscipler ? (
            <DisciplerSection discipler={myDiscipler} preview={preview} />
          ) : null}

          {archived ? (
            <p className="rounded-sm border border-zinc-200 bg-white p-4 text-xs text-zinc-600">
              Your discipleship group has been paused by the Pleros team. Contact support if you
              think this is a mistake.
            </p>
          ) : (
            <InviteSection data={data} preview={preview} />
          )}

          <SogpActivitySection
            title={`Your disciples (${myGroup.disciples.length})`}
            description="See who took part each day. Tap a disciple for their progress and follow-up."
            icon={<UsersIcon className={iconClass} strokeWidth={2} />}
          >
            {myGroup.disciples.length === 0 ? (
              <p className="text-xs text-zinc-500">
                No one yet. Share your invite link with the people you&apos;d like to walk with
                through SOGP.
              </p>
            ) : (
              <DiscipleParticipationTable
                disciples={myGroup.disciples}
                range={data.participationRange}
                preview={preview}
              />
            )}
          </SogpActivitySection>
        </div>

        {!archived ? (
          <div className="grid gap-4">
            <SogpActivitySection
              title="Check-ins"
              description="Ask a question, read each answer privately and reply to encourage them."
              icon={<MessageCircleQuestionIcon className={iconClass} strokeWidth={2} />}
            >
              <PromptComposer
                preview={preview}
                hasDisciples={myGroup.disciples.length > 0}
                suggestions={myGroup.promptSuggestions.suggestions}
                levelTitle={myGroup.promptSuggestions.levelTitle}
              />
              <LeaderPromptList
                prompts={myGroup.prompts}
                discipleCount={myGroup.disciples.length}
                preview={preview}
              />
            </SogpActivitySection>

            <SogpActivitySection
              title="Prayer requests"
              description="Requests your disciples share with you. Let them know when you've prayed."
              icon={<HandHelpingIcon className={iconClass} strokeWidth={2} />}
            >
              <LeaderPrayerList requests={myGroup.prayerRequests} preview={preview} />
            </SogpActivitySection>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function InviteSection({
  data,
  preview,
}: {
  data: DiscipleshipDashboardData;
  preview: boolean;
}) {
  const { myGroup } = data;
  const message = buildDiscipleshipShareMessage(data.viewer.firstName);
  const hrefs = Object.fromEntries(
    PLATFORMS.map((platform) => [
      platform,
      buildPreSogpShareIntentUrl({ platform, postUrl: myGroup.inviteUrl, message }),
    ]),
  ) as Record<PreSogpShareIntentPlatform, string>;
  const regenerate = useDiscipleshipAction(preview);
  const full = myGroup.disciples.length >= DISCIPLESHIP_GROUP_MAX;

  return (
    <SogpActivitySection
      title="Your invite link"
      description="Anyone enrolled in SOGP who opens this link can join your discipleship group."
      icon={<LinkIcon className={iconClass} strokeWidth={2} />}
    >
      {full ? (
        <p className="text-xs text-amber-700">
          Your group is full. Groups have up to {DISCIPLESHIP_GROUP_MAX} people.
        </p>
      ) : null}
      <p className="break-all rounded-sm border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-700">
        {myGroup.inviteUrl}
      </p>
      <ShareIntentButtons
        hrefs={hrefs}
        copyValue={myGroup.inviteUrl}
        nativeShare={{ title: "Join my SOGP discipleship group", text: message, url: myGroup.inviteUrl }}
      />
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-100 pt-3">
        <SharePhoneToggle
          id="leader-shares-phone"
          label="Let my disciples contact me on WhatsApp"
          initial={myGroup.leaderSharesPhone}
          preview={preview}
          onChange={(sharesPhone) => setLeaderSharesPhoneAction({ sharesPhone })}
        />
        <button
          type="button"
          disabled={regenerate.pending}
          onClick={() => {
            if (window.confirm("Create a new link? Your old link will stop working.")) {
              regenerate.run(() => regenerateInviteLinkAction());
            }
          }}
          className={quietButtonClass}
        >
          Create a new link
        </button>
      </div>
      {regenerate.error ? (
        <p role="alert" className="text-xs text-red-700">
          {regenerate.error}
        </p>
      ) : null}
    </SogpActivitySection>
  );
}

/** Stable sample activity for the preview route, which has no server data. */
function previewParticipation(
  disciples: DiscipleSummary[],
  dateKey: string,
): DiscipleDayParticipation[] {
  const day = Number(dateKey.slice(-2));
  return disciples.map((disciple, index) => {
    const seed = (day + index * 3) % 7;
    return {
      membershipId: disciple.membershipId,
      prayerWatch: seed !== 0 && seed !== 4,
      listened: day % 7 === 0 ? null : seed < 5,
      quizAttempted: seed % 2 === 0 && seed !== 0,
      writtenSubmitted: seed === 2 || seed === 5,
      reviewAttended: seed > 1 && seed !== 6,
    };
  });
}

function dayActivities(day: DiscipleDayParticipation) {
  return [
    day.prayerWatch,
    day.listened,
    day.quizAttempted,
    day.writtenSubmitted,
    day.reviewAttended,
  ].filter((value): value is boolean => value !== null);
}

const stepButtonClass =
  "inline-flex h-8 items-center rounded-sm border border-zinc-200 bg-white px-2 text-zinc-600 hover:bg-zinc-50 disabled:opacity-40";

function DiscipleParticipationTable({
  disciples,
  range,
  preview,
}: {
  disciples: DiscipleSummary[];
  range: DiscipleshipDashboardData["participationRange"];
  preview: boolean;
}) {
  const maxDate = range?.end ?? lagosToday();
  const minDate = range?.start ?? maxDate;
  const [date, setDate] = useState(maxDate);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const toggle = (id: number) => setExpandedId((current) => (current === id ? null : id));

  const { data, isLoading, error } = useQuery({
    queryKey: ["discipleship", "participation", date, disciples.map((d) => d.membershipId).join()],
    queryFn: () =>
      preview
        ? Promise.resolve(previewParticipation(disciples, date))
        : getDiscipleParticipationAction(date),
    placeholderData: keepPreviousData,
  });
  const dayByMembership = new Map((data ?? []).map((day) => [day.membershipId, day]));

  return (
    <div className="overflow-hidden rounded-sm border border-zinc-200 bg-white">
      <div className="flex items-end gap-2 border-b border-zinc-100 px-3 py-2.5">
        <button
          type="button"
          aria-label="Previous day"
          disabled={date <= minDate}
          onClick={() => setDate(clampDate(shiftDate(date, -1), minDate, maxDate))}
          className={stepButtonClass}
        >
          <ChevronLeftIcon className="size-3.5" />
        </button>
        <label className="grid min-w-0 flex-1 gap-1 text-xs font-medium text-zinc-700 sm:flex-none">
          Day
          <input
            type="date"
            value={date}
            min={minDate}
            max={maxDate}
            onChange={(event) => event.target.value && setDate(event.target.value)}
            className="h-8 w-full min-w-0 rounded-sm border border-zinc-200 bg-white px-2 text-xs"
          />
        </label>
        <button
          type="button"
          aria-label="Next day"
          disabled={date >= maxDate}
          onClick={() => setDate(clampDate(shiftDate(date, 1), minDate, maxDate))}
          className={stepButtonClass}
        >
          <ChevronRightIcon className="size-3.5" />
        </button>
      </div>

      {error ? (
        <p role="alert" className="px-3 py-2 text-xs text-red-700">
          Couldn&apos;t load this day. Try again shortly.
        </p>
      ) : null}

      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-xs">
          <thead className="bg-zinc-50 text-zinc-500">
            <tr>
              <th className="px-3 py-2.5 font-medium">Disciple</th>
              <th className="hidden px-3 py-2.5 font-medium md:table-cell">Status</th>
              <th className="hidden px-3 py-2.5 font-medium md:table-cell">Prayer watch</th>
              <th className="hidden px-3 py-2.5 font-medium md:table-cell">Teaching</th>
              <th className="hidden px-3 py-2.5 font-medium md:table-cell">Quiz</th>
              <th className="hidden px-3 py-2.5 font-medium md:table-cell">Response</th>
              <th className="hidden px-3 py-2.5 font-medium md:table-cell">Review</th>
              <th className="px-3 py-2.5 text-right font-medium md:hidden">Done</th>
              <th className="w-8 px-2 py-2.5">
                <span className="sr-only">Details</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {disciples.map((disciple) => {
              const day = dayByMembership.get(disciple.membershipId) ?? null;
              const activities = day ? dayActivities(day) : [];
              const done = activities.filter(Boolean).length;
              const inactive = day !== null && done === 0;
              const expanded = expandedId === disciple.membershipId;
              const detailsId = `disciple-${disciple.membershipId}`;
              const rowTone = inactive ? "bg-rose-50/60" : "";
              const status = disciple.status ? STATUS_DISPLAY[disciple.status] : null;
              const statusPill = status ? (
                <span
                  className={`inline-block whitespace-nowrap rounded-full px-2 py-0.5 text-[0.65rem] font-semibold ${status.className}`}
                >
                  {status.label}
                </span>
              ) : null;
              const loadingMark = <span className="text-zinc-300">{isLoading ? "…" : "—"}</span>;

              return (
                <Fragment key={disciple.membershipId}>
                  <tr
                    onClick={() => toggle(disciple.membershipId)}
                    className={`cursor-pointer hover:bg-zinc-50 ${rowTone} ${expanded ? "border-b-0" : ""}`}
                  >
                    <td className="px-3 py-3">
                      <span className="block max-w-[11rem] truncate text-sm font-semibold text-zinc-900 sm:max-w-none">
                        {disciple.name}
                      </span>
                      {disciple.openPrayerCount > 0 ? (
                        <span className="mt-1 inline-block rounded-full bg-sky-50 px-2 py-0.5 text-[0.65rem] font-semibold text-[var(--color-brand-blue)]">
                          {disciple.openPrayerCount} prayer request{disciple.openPrayerCount === 1 ? "" : "s"}
                        </span>
                      ) : null}
                      {statusPill ? <div className="mt-1 md:hidden">{statusPill}</div> : null}
                    </td>
                    <td className="hidden px-3 py-3 md:table-cell">
                      {statusPill ?? <span className="text-zinc-300">—</span>}
                    </td>
                    <td className="hidden px-3 py-3 md:table-cell">
                      {day ? <Mark value={day.prayerWatch} /> : loadingMark}
                    </td>
                    <td className="hidden px-3 py-3 md:table-cell">
                      {day ? <Mark value={day.listened} /> : loadingMark}
                    </td>
                    <td className="hidden px-3 py-3 md:table-cell">
                      {day ? <Mark value={day.quizAttempted} /> : loadingMark}
                    </td>
                    <td className="hidden px-3 py-3 md:table-cell">
                      {day ? <Mark value={day.writtenSubmitted} /> : loadingMark}
                    </td>
                    <td className="hidden px-3 py-3 md:table-cell">
                      {day ? <Mark value={day.reviewAttended} /> : loadingMark}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-right md:hidden">
                      {day ? (
                        <span className={inactive ? "text-red-700" : "font-medium text-zinc-900"}>
                          {done}/{activities.length}
                        </span>
                      ) : (
                        loadingMark
                      )}
                    </td>
                    <td className="px-2 py-3">
                      <ExpandButton
                        expanded={expanded}
                        controls={detailsId}
                        label={`details for ${disciple.firstName}`}
                        onToggle={() => toggle(disciple.membershipId)}
                      />
                    </td>
                  </tr>
                  {expanded ? (
                    <tr id={detailsId} className={rowTone}>
                      <td colSpan={9} className="px-3 pb-3 pt-0">
                        <div className="grid gap-2.5">
                          {day ? (
                            <div className="md:hidden">
                              <DetailGrid
                                items={[
                                  ["Prayer watch", <Mark key="prayer" value={day.prayerWatch} />],
                                  ["Teaching", <Mark key="teaching" value={day.listened} />],
                                  ["Quiz", <Mark key="quiz" value={day.quizAttempted} />],
                                  ["Response", <Mark key="response" value={day.writtenSubmitted} />],
                                  ["Review", <Mark key="review" value={day.reviewAttended} />],
                                ]}
                              />
                            </div>
                          ) : null}
                          <DiscipleDetails disciple={disciple} preview={preview} />
                        </div>
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="border-t border-zinc-100 px-3 py-2 text-[0.65rem] text-zinc-500">
        <span className="md:hidden">Done counts the activities they did that day. </span>
        Highlighted disciples took no part that day; — means no teaching was released.
      </p>
    </div>
  );
}

/** A disciple's overall progress, follow-up and actions — the dropdown under
 * their row in the participation table. */
function DiscipleDetails({ disciple, preview }: { disciple: DiscipleSummary; preview: boolean }) {
  const remove = useDiscipleshipAction(preview);

  return (
    <div className="grid gap-2.5 rounded-sm border border-zinc-200 bg-white p-3">
      <p className="text-[0.7rem] text-zinc-400">
        Joined {formatDiscipleshipDate(disciple.joinedAt)}
        {disciple.lastActiveAt
          ? ` · Last active ${formatDiscipleshipDate(disciple.lastActiveAt)}`
          : " · No activity yet"}
      </p>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-2.5">
        <Metric
          label="Pre-SOGP"
          value={disciple.preparationDaysComplete}
          max={disciple.preparationDaysTotal}
        />
        <Metric label="Assessments" value={disciple.coreCompleted} max={disciple.coreTotal} />
        <Metric
          label="Morning Prayer Watch"
          value={disciple.prayerCompleted}
          max={disciple.prayerTotal}
          suffix={disciple.prayerPercent !== null ? `${disciple.prayerPercent}%` : undefined}
        />
        <Metric label="Daily reviews" value={disciple.reviewsCompleted} max={disciple.reviewsTotal} />
      </dl>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[0.7rem] text-zinc-500">
        <span>
          Average score:{" "}
          <span className="font-semibold text-zinc-800">
            {disciple.averageQuizScore !== null ? `${disciple.averageQuizScore}%` : "No quizzes yet"}
          </span>
        </span>
        <span>
          Certificate:{" "}
          <span className={`font-semibold ${disciple.eligible ? "text-emerald-700" : "text-zinc-800"}`}>
            {disciple.eligible ? "On course to qualify" : "Not yet eligible"}
          </span>
        </span>
      </div>

      <div className="grid gap-2 border-t border-zinc-100 pt-2.5">
        <LastContactLine disciple={disciple} />
        <DiscipleFollowUp disciple={disciple} preview={preview} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-100 pt-2.5">
        {disciple.whatsappUrl ? (
          <a
            href={disciple.whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => {
              if (!preview) {
                void logWhatsAppContactAction({ membershipId: disciple.membershipId });
              }
            }}
            className={whatsappButtonClass}
          >
            <MessageCircleIcon className="size-3.5" strokeWidth={2} /> Message on WhatsApp
          </a>
        ) : (
          <span className="text-[0.7rem] text-zinc-400">WhatsApp not shared</span>
        )}
        <button
          type="button"
          disabled={remove.pending}
          onClick={() => {
            if (window.confirm(`Remove ${disciple.firstName} from your group?`)) {
              remove.run(() => removeDiscipleAction({ membershipId: disciple.membershipId }));
            }
          }}
          className="text-xs font-medium text-zinc-500 underline-offset-4 hover:text-red-700 hover:underline disabled:opacity-60"
        >
          Remove
        </button>
      </div>
      {remove.error ? (
        <p role="alert" className="text-xs text-red-700">
          {remove.error}
        </p>
      ) : null}
    </div>
  );
}

function Metric({
  label,
  value,
  max,
  suffix,
}: {
  label: string;
  value: number | null;
  max: number | null;
  suffix?: string;
}) {
  const ready = value !== null && max !== null && max > 0;
  return (
    <div className="grid gap-1">
      <dt className="text-[0.65rem] font-medium uppercase tracking-[0.06em] text-zinc-400">{label}</dt>
      <dd className="grid gap-1">
        <span className="text-xs text-zinc-700">
          {ready ? `${value} of ${max}` : "Not started"}
          {ready && suffix ? <span className="text-zinc-400"> · {suffix}</span> : null}
        </span>
        {ready ? <ProgressBar value={value} max={max} /> : null}
      </dd>
    </div>
  );
}

function DisciplerSection({
  discipler,
  preview,
}: {
  discipler: NonNullable<DiscipleshipDashboardData["myDiscipler"]>;
  preview: boolean;
}) {
  const leave = useDiscipleshipAction(preview);
  const waiting = discipler.prompts.filter((prompt) => !prompt.response).length;

  return (
    <SogpActivitySection
      title={`Your discipler: ${discipler.leaderFirstName}`}
      description={
        waiting > 0
          ? `${waiting} check-in${waiting === 1 ? "" : "s"} waiting for your answer.`
          : `You joined ${discipler.groupName} on ${formatDiscipleshipDate(discipler.joinedAt)}.`
      }
      icon={<HeartHandshakeIcon className={iconClass} strokeWidth={2} />}
    >
      {discipler.whatsappUrl ? (
        <a
          href={discipler.whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`${whatsappButtonClass} justify-self-start`}
        >
          <MessageCircleIcon className="size-3.5" strokeWidth={2} /> Message {discipler.leaderFirstName} on
          WhatsApp
        </a>
      ) : null}
      <DisciplePromptList
        prompts={discipler.prompts}
        leaderFirstName={discipler.leaderFirstName}
        preview={preview}
      />
      <DisciplePrayerSection
        requests={discipler.prayerRequests}
        leaderFirstName={discipler.leaderFirstName}
        preview={preview}
      />
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-100 pt-3">
        <SharePhoneToggle
          id="disciple-shares-phone"
          label={`Let ${discipler.leaderFirstName} contact me on WhatsApp`}
          initial={discipler.sharesPhone}
          preview={preview}
          onChange={(sharesPhone) => setDiscipleSharesPhoneAction({ sharesPhone })}
        />
        <button
          type="button"
          disabled={leave.pending}
          onClick={() => {
            if (
              window.confirm(
                `Leave ${discipler.leaderFirstName}'s group? They will no longer see your progress or answers.`,
              )
            ) {
              leave.run(() => leaveDiscipleshipGroupAction());
            }
          }}
          className="text-xs font-medium text-zinc-500 underline-offset-4 hover:text-red-700 hover:underline disabled:opacity-60"
        >
          Leave group
        </button>
      </div>
      {leave.error ? (
        <p role="alert" className="text-xs text-red-700">
          {leave.error}
        </p>
      ) : null}
    </SogpActivitySection>
  );
}

function SharePhoneToggle({
  id,
  label,
  initial,
  preview,
  onChange,
}: {
  id: string;
  label: string;
  initial: boolean;
  preview: boolean;
  onChange: (value: boolean) => ReturnType<typeof setLeaderSharesPhoneAction>;
}) {
  const [checked, setChecked] = useState(initial);
  const { pending, error, run } = useDiscipleshipAction(preview);

  return (
    <span className="grid gap-1">
      <label htmlFor={id} className="flex items-center gap-2 text-xs text-zinc-700">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          disabled={pending}
          onChange={(event) => {
            const next = event.target.checked;
            setChecked(next);
            run(() => onChange(next), undefined, () => setChecked(!next));
          }}
          className="size-4 accent-[var(--color-brand-blue)]"
        />
        {label}
      </label>
      {error ? (
        <span role="alert" className="text-[0.7rem] text-red-700">
          {error}
        </span>
      ) : null}
    </span>
  );
}
