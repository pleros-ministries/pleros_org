"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { MessageCircleIcon } from "lucide-react";

import { logWhatsAppContactAction, removeDiscipleAction } from "@/app/(site)/dashboard/sogp/discipleship/_actions";
import { LeaderPromptList, formatDiscipleshipDate, useDiscipleshipAction } from "@/components/sogp/discipleship-check-ins";
import { LeaderEpisodeQuestionList } from "@/components/sogp/discipleship-episode-questions";
import { DiscipleFollowUp, LastContactLine } from "@/components/sogp/discipleship-nudge";
import { LeaderPrayerList } from "@/components/sogp/discipleship-prayer";
import type { DiscipleWork } from "@/lib/db/queries/discipleship-work";
import type { LeaderEpisodeQuestion } from "@/lib/db/queries/sogp-episode-questions";
import type { DiscipleSummary, LeaderPrompt, DiscipleshipPrayerRequest } from "@/lib/db/queries/sogp-discipleship";

import { CrumbLabel } from "@/components/dashboard/shell/breadcrumbs";

import { GroupTabs } from "../groups/group-hero";
import styles from "./discipleship-group.module.css";
import { Initials, statusOf } from "./shared";
import { groupPath } from "./leader-group";

export type DiscipleWeekDay = { date: string; label: string; state: "done" | "missed" | "today" | "none" };

type Tab = "week" | "work" | "checkins" | "prayer" | "questions";

const percent = (value: number | null) => value === null ? "–" : `${value}%`;
const ofTotal = (value: number | null, max: number | null) => value === null || !max ? "Not started" : `${value} of ${max}`;

/**
 * One disciple, opened from their group: this week's activity, their
 * check-in answers and prayer requests, and the leader's follow-up tools.
 * Their discipler also sees their quiz answers and written work.
 */
export function DiscipleDetail({ groupId, groupName, disciple, week, work, prompts, prayerRequests, episodeQuestions, paused }: {
  groupId: number;
  groupName: string;
  disciple: DiscipleSummary;
  week: DiscipleWeekDay[];
  work: DiscipleWork;
  prompts: LeaderPrompt[];
  prayerRequests: DiscipleshipPrayerRequest[];
  episodeQuestions: LeaderEpisodeQuestion[];
  paused: boolean;
}) {
  const router = useRouter();
  const remove = useDiscipleshipAction(false);
  const status = statusOf(disciple.status);
  const ownPrompts = prompts.map(prompt => ({ ...prompt, responses: prompt.responses.filter(response => response.discipleEnrollmentId === disciple.enrollmentId) }));
  const ownPrayer = prayerRequests.filter(request => request.discipleEnrollmentId === disciple.enrollmentId);
  const tabs: Array<{ key: Tab; label: string; count?: number }> = [
    { key: "week", label: "This week" },
    { key: "work", label: "Work", count: work.quizzes.length + work.written.length || undefined },
    ...(paused ? [] : [
      { key: "checkins" as const, label: "Check-ins" },
      { key: "prayer" as const, label: "Prayer", count: ownPrayer.filter(request => request.status === "open").length || undefined },
      ...(episodeQuestions.length ? [{ key: "questions" as const, label: "Questions", count: episodeQuestions.length }] : []),
    ]),
  ];
  const [tab, setTab] = useState<Tab>("week");

  return <div className={styles.page}>
    <CrumbLabel href={groupPath(groupId)} label={groupName} />
    <CrumbLabel href={`${groupPath(groupId)}/disciples/${disciple.membershipId}`} label={disciple.firstName} />
    <div className={styles.profile}>
      <Initials name={disciple.name} size="lg" />
      <div className="grid min-w-0">
        <h1>{disciple.name}</h1>
        <span className={styles.profileMeta}>
          Joined {formatDiscipleshipDate(disciple.joinedAt)}
          {status ? <> · <span style={{ color: status.tone === "ok" ? "#2331ae" : status.tone === "risk" ? "#92400e" : "#9b2c2c" }}>{status.label}</span></> : null}
        </span>
      </div>
    </div>

    {!paused ? <div className="grid gap-2">
      {disciple.whatsappUrl ? <div className={styles.actions}>
        <a href={disciple.whatsappUrl} target="_blank" rel="noopener noreferrer" className={styles.btn} onClick={() => { void logWhatsAppContactAction({ membershipId: disciple.membershipId }); }}>
          <MessageCircleIcon className="size-3.5" strokeWidth={2} /> WhatsApp {disciple.firstName}
        </a>
      </div> : null}
      <div className={styles.tools} style={{ padding: 0 }}><DiscipleFollowUp disciple={disciple} preview={false} /></div>
    </div> : null}

    <div className={styles.strip}>
      <div><strong>{disciple.coreTotal ? `${disciple.coreCompleted ?? 0}/${disciple.coreTotal}` : "–"}</strong><span>Assessments</span></div>
      <div><strong>{percent(disciple.averageQuizScore)}</strong><span>Quiz average</span></div>
      <div><strong>{percent(disciple.prayerPercent)}</strong><span>Prayer Watch</span></div>
    </div>

    <GroupTabs tabs={tabs} value={tab} onChange={setTab} />

    {tab === "week" ? <>
      <div className={styles.panel}>
        <div className={styles.week} aria-label="Days they took part this week">
          {week.map(day => <div key={day.date} className={styles.day}>
            <i data-state={day.state} aria-label={`${day.label}: ${day.state === "done" ? "took part" : day.state === "missed" ? "no activity" : day.state === "today" ? "today, nothing yet" : "no data"}`}>{day.state === "done" ? "✓" : day.state === "missed" ? "–" : ""}</i>
            {day.label.slice(0, 1)}
          </div>)}
        </div>
        <div className={styles.kv}><span>Last active</span><b>{disciple.lastActiveAt ? formatDiscipleshipDate(disciple.lastActiveAt) : "No activity yet"}</b></div>
        <div className={styles.kv}><span>Pre-SOGP</span><b>{ofTotal(disciple.preparationDaysComplete, disciple.preparationDaysTotal)}</b></div>
        <div className={styles.kv}><span>Daily reviews</span><b>{ofTotal(disciple.reviewsCompleted, disciple.reviewsTotal)}</b></div>
        <div className={styles.kv}><span>Certificate</span><b>{disciple.eligible ? "On course to qualify" : "Not yet eligible"}</b></div>
      </div>
      <div className={`${styles.panel} ${styles.tools}`}><LastContactLine disciple={disciple} /></div>
    </> : null}

    {tab === "work" ? <DiscipleWorkView work={work} firstName={disciple.firstName} /> : null}

    {tab === "checkins" ? <div className={`${styles.panel} ${styles.tools}`}>
      <p className={styles.note} style={{ margin: 0 }}>Their check-in answers are private to you and {disciple.firstName}.</p>
      <LeaderPromptList prompts={ownPrompts} discipleCount={1} preview={false} />
    </div> : null}

    {tab === "prayer" ? <div className={`${styles.panel} ${styles.tools}`}><LeaderPrayerList requests={ownPrayer} preview={false} /></div> : null}

    {tab === "questions" ? <div className={`${styles.panel} ${styles.tools}`}><LeaderEpisodeQuestionList questions={episodeQuestions} preview={false} /></div> : null}

    <p className={styles.note}>🔒 Only you, as {disciple.firstName}&apos;s discipler, see their work here. Other disciples never do.</p>

    {!paused ? <button type="button" className={styles.danger} disabled={remove.pending} onClick={() => {
      if (window.confirm(`Remove ${disciple.firstName} from your group?`)) {
        remove.run(() => removeDiscipleAction({ membershipId: disciple.membershipId }), () => router.replace(groupPath(groupId)));
      }
    }}>Remove from group</button> : null}
    {remove.error ? <p role="alert" className={styles.error}>{remove.error}</p> : null}
  </div>;
}

const SUBMISSION: Record<DiscipleWork["written"][number]["status"], string> = { submitted: "Submitted", approved: "Approved", needs_revision: "Needs revision" };

/** Their latest quiz attempt per lesson (with each answer) and their submitted written responses. */
function DiscipleWorkView({ work, firstName }: { work: DiscipleWork; firstName: string }) {
  if (!work.quizzes.length && !work.written.length) {
    return <p className={`${styles.panel} ${styles.empty}`}>{firstName} hasn&apos;t taken a quiz or sent a written response yet.</p>;
  }
  return <>
    {work.written.length ? <>
      <div className={styles.sectionTitle}><h2>Written responses</h2></div>
      <div className={styles.panel}>
        {work.written.map(item => <details key={item.lessonId} className={styles.work}>
          <summary><span className={styles.rowCopy}><span className={styles.rowTitle}>{item.lessonTitle}</span><span className={styles.rowMeta}>{SUBMISSION[item.status]}{item.submittedAt ? ` · ${formatDiscipleshipDate(item.submittedAt)}` : ""}</span></span></summary>
          {item.prompt ? <p className={styles.workPrompt}>{item.prompt}</p> : null}
          <p className={styles.workBody}>{item.content}</p>
        </details>)}
      </div>
    </> : null}
    {work.quizzes.length ? <>
      <div className={styles.sectionTitle}><h2>Quizzes</h2></div>
      <div className={styles.panel}>
        {work.quizzes.map(quiz => <details key={quiz.lessonId} className={styles.work}>
          <summary>
            <span className={styles.rowCopy}><span className={styles.rowTitle}>{quiz.lessonTitle}</span><span className={styles.rowMeta}>{formatDiscipleshipDate(quiz.takenAt)}{quiz.attemptNumber > 1 ? ` · attempt ${quiz.attemptNumber}` : ""}</span></span>
            <span className={styles.pill} data-tone={quiz.score >= 70 ? "ok" : "risk"}>{quiz.score}%</span>
          </summary>
          <ol className={styles.answers}>
            {quiz.answers.map((answer, index) => <li key={index}>
              <p className={styles.workPrompt}>{answer.question}</p>
              <p className={styles.workBody} data-mark={answer.correct === null ? undefined : answer.correct ? "right" : "wrong"}>{answer.answer || "No answer"}</p>
              {answer.correct === false && answer.correctAnswer ? <p className={styles.rowMeta}>Correct answer: {answer.correctAnswer}</p> : null}
            </li>)}
          </ol>
        </details>)}
      </div>
    </> : null}
  </>;
}
