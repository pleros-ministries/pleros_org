"use client";

import { useRef, useState, useTransition } from "react";
import { CheckIcon, ClockIcon, PlusIcon, Trash2Icon } from "lucide-react";

import {
  addGoalAction, addTodoAction, removeGoalAction, removeTodoAction, saveOutcomesAction, setTodoDoneAction,
} from "@/app/(site)/dashboard/community/_actions/natural-assignment-actions";
import styles from "@/components/community/discipleship/discipleship-group.module.css";
import type { NaturalAssignmentDay, NaturalAssignmentGoal } from "@/lib/db/queries/natural-assignment";

/**
 * Natural assignment (Pastor, 20 October; built from the approved mockup):
 * plan the day's goals with to-dos and deadlines, tick them through the day,
 * then say what happened against each goal. Every change shows at once and
 * rolls back with a message if it doesn't save.
 */

const input = "h-10 w-full rounded-[10px] border border-[var(--dashboard-panel-edge,#e2e5ea)] bg-white px-3 text-[16px] font-normal outline-none focus:border-[var(--color-community-blue)]";

/** "14:00" → "2:00 pm". */
export function deadlineLabel(value: string) {
  const [h, m] = value.split(":").map(Number);
  return `${(h! % 12) || 12}:${String(m).padStart(2, "0")} ${h! < 12 ? "am" : "pm"}`;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="grid gap-1.5 text-[13px] font-medium text-[var(--color-community-ink)]">{label}{children}</label>;
}

type Result = { ok: true; day: NaturalAssignmentDay } | { ok: false; error: string };

export function NaturalAssignment({ initial, dateLabel, writable, initialStage }: { initial: NaturalAssignmentDay; dateLabel: string; writable: boolean; initialStage: "plan" | "review" }) {
  const [day, setDay] = useState(initial);
  const [stage, setStage] = useState(initialStage);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [goalDraft, setGoalDraft] = useState("");
  const [drafts, setDrafts] = useState<Record<number, { text: string; deadline: string }>>({});
  const [outcomes, setOutcomes] = useState<Record<number, string>>(() => Object.fromEntries(initial.goals.map(goal => [goal.id, goal.outcome])));
  const [pending, start] = useTransition();
  // Temporary ids for things not saved yet, so they can't be changed until they are.
  const temp = useRef(-1);
  const todos = day.goals.flatMap(goal => goal.todos);
  const finished = todos.filter(todo => todo.done).length;
  const next = todos.filter(todo => !todo.done && todo.deadline).map(todo => todo.deadline!).sort()[0];

  /** Show the change now; replace it with what was saved, or put it back and say why. */
  const save = (change: (goals: NaturalAssignmentGoal[]) => NaturalAssignmentGoal[], action: () => Promise<Result>) => {
    const before = day;
    setError(null); setNotice(null);
    setDay(current => ({ ...current, goals: change(current.goals) }));
    start(async () => {
      const result = await action().catch((): Result => ({ ok: false, error: "Couldn’t save that. Check your connection and try again." }));
      if (result.ok) setDay(result.day);
      else { setDay(before); setError(result.error); }
    });
  };

  const addGoal = () => {
    const title = goalDraft.trim();
    if (!title) return;
    setGoalDraft("");
    save(goals => [...goals, { id: temp.current--, title, outcome: "", todos: [] }], () => addGoalAction(day.date, title));
  };
  const addTodo = (goalId: number) => {
    const entry = drafts[goalId];
    if (!entry?.text.trim()) return;
    setDrafts(current => ({ ...current, [goalId]: { text: "", deadline: "" } }));
    save(goals => goals.map(goal => goal.id === goalId ? { ...goal, todos: [...goal.todos, { id: temp.current--, text: entry.text.trim(), deadline: entry.deadline || null, done: false }] } : goal),
      () => addTodoAction(goalId, entry.text, entry.deadline || null));
  };
  const submitOutcomes = () => {
    const list = day.goals.filter(goal => goal.id > 0).map(goal => ({ goalId: goal.id, outcome: outcomes[goal.id] ?? "" }));
    save(goals => goals.map(goal => ({ ...goal, outcome: outcomes[goal.id] ?? goal.outcome })), async () => {
      const result = await saveOutcomesAction(day.date, list);
      if (result.ok) setNotice("Saved. Your leader sees it beside your daily report.");
      return result;
    });
  };

  const tabs = <div className="grid grid-cols-2 rounded-[10px] bg-[#eceef2] p-[3px]" role="tablist" aria-label="Part of the day">
    {([["plan", "Plan the day"], ["review", "End of day"]] as const).map(([key, label]) => <button key={key} type="button" role="tab" aria-selected={stage === key} onClick={() => setStage(key)}
      className={`inline-flex h-8 items-center justify-center rounded-[7px] text-[13px] font-medium ${stage === key ? "bg-white text-[var(--color-community-ink)] shadow-[0_1px_2px_rgb(0_0_0/8%)]" : "text-[var(--color-community-muted)]"}`}>{label}</button>)}
  </div>;

  return <div className={styles.page}>
    <div className={styles.heading}><div><h1>Natural assignment</h1><p className={styles.sub}>{dateLabel} · optional</p></div></div>
    {writable ? tabs : <p className={styles.rowMeta}>This day is view only. You can change it for today and the past 7 days.</p>}
    <div className={styles.strip}>
      <div><span>Goals</span><strong>{day.goals.length}</strong></div>
      <div><span>To-dos done</span><strong>{finished}/{todos.length}</strong></div>
      <div><span>Next deadline</span><strong style={{ fontSize: 15 }}>{next ? deadlineLabel(next) : "None"}</strong></div>
    </div>
    {error ? <p role="alert" className="text-[13px] leading-5 text-[#9b2c2c]">{error}</p> : null}

    {day.goals.map((goal, index) => {
      const saved = goal.id > 0;
      return <section key={goal.id} className={styles.panel} aria-label={goal.title}>
        <div className="flex items-start gap-3 px-3.5 pt-3.5 pb-2">
          <span className="grid min-w-0 flex-1 gap-0.5">
            <span className={styles.rowMeta}>Goal {index + 1}</span>
            <span className="font-[family-name:var(--font-dashboard-heading)] text-[15px] leading-[22px] font-medium">{goal.title}</span>
          </span>
          {writable && stage === "plan" ? <button type="button" className="grid size-8 shrink-0 place-items-center rounded-full text-[var(--color-community-muted)]" aria-label={`Remove goal: ${goal.title}`} disabled={!saved || pending}
            onClick={() => save(goals => goals.filter(item => item.id !== goal.id), () => removeGoalAction(goal.id))}><Trash2Icon className="size-4" strokeWidth={2} /></button> : null}
        </div>
        {goal.todos.length ? <ul className={styles.list}>{goal.todos.map(todo => <li key={todo.id}><div className={`${styles.row} items-start`}>
          <button type="button" aria-pressed={todo.done} aria-label={todo.done ? `Undo: ${todo.text}` : `Done: ${todo.text}`} disabled={!writable || todo.id < 0}
            onClick={() => save(goals => goals.map(item => item.id === goal.id ? { ...item, todos: item.todos.map(entry => entry.id === todo.id ? { ...entry, done: !entry.done } : entry) } : item), () => setTodoDoneAction(todo.id, !todo.done))}
            className="mt-0.5 grid size-[22px] shrink-0 place-items-center rounded-full border-[1.5px] text-white"
            style={todo.done ? { borderColor: "var(--color-community-blue, #2056d6)", background: "var(--color-community-blue, #2056d6)" } : { borderColor: "#c9ced6" }}>
            {todo.done ? <CheckIcon className="size-3" strokeWidth={3} /> : null}
          </button>
          <span className={`${styles.rowCopy} gap-0.5`}>
            <span className={styles.rowTitle} style={{ whiteSpace: "normal", textDecoration: todo.done ? "line-through" : undefined, color: todo.done ? "var(--color-community-muted)" : undefined }}>{todo.text}</span>
            <span className={`${styles.rowMeta} inline-flex items-center gap-1`}><ClockIcon className="size-3" strokeWidth={2.2} />{todo.deadline ? `By ${deadlineLabel(todo.deadline)}` : "Any time today"}</span>
          </span>
          {writable && stage === "plan" ? <button type="button" className="grid size-8 shrink-0 place-items-center rounded-full text-[var(--color-community-muted)]" aria-label={`Remove: ${todo.text}`} disabled={todo.id < 0}
            onClick={() => save(goals => goals.map(item => item.id === goal.id ? { ...item, todos: item.todos.filter(entry => entry.id !== todo.id) } : item), () => removeTodoAction(todo.id))}><Trash2Icon className="size-4" strokeWidth={2} /></button> : null}
        </div></li>)}</ul> : null}
        {!writable ? goal.outcome ? <p className="border-t border-(--color-line) px-3.5 py-3 text-[13.5px] leading-5 whitespace-pre-line">{goal.outcome}</p> : null
          : stage === "plan" ? <div className="grid gap-2 border-t border-(--color-line) p-3.5">
            <div className="grid grid-cols-[1fr_7.5rem] gap-2">
              <Field label="Add a to-do"><input className={input} value={drafts[goal.id]?.text ?? ""} maxLength={200} placeholder="What will you do?" disabled={!saved}
                onChange={event => setDrafts(current => ({ ...current, [goal.id]: { deadline: current[goal.id]?.deadline ?? "", text: event.target.value } }))}
                onKeyDown={event => { if (event.key === "Enter") { event.preventDefault(); addTodo(goal.id); } }} /></Field>
              <Field label="By"><input className={input} type="time" value={drafts[goal.id]?.deadline ?? ""} disabled={!saved}
                onChange={event => setDrafts(current => ({ ...current, [goal.id]: { text: current[goal.id]?.text ?? "", deadline: event.target.value } }))} /></Field>
            </div>
            <button type="button" className={`${styles.btn} ${styles.mini} justify-self-start`} disabled={!saved || !drafts[goal.id]?.text?.trim()} onClick={() => addTodo(goal.id)}><PlusIcon className="size-3.5" strokeWidth={2.2} />Add to-do</button>
          </div>
          : <div className="border-t border-(--color-line) p-3.5">
            <Field label="What happened?"><textarea className={`${input} h-auto min-h-[72px] py-2`} value={outcomes[goal.id] ?? ""} maxLength={1000} placeholder="What you did against this goal, and what’s left"
              onChange={event => setOutcomes(current => ({ ...current, [goal.id]: event.target.value }))} /></Field>
          </div>}
      </section>;
    })}

    {!day.goals.length ? <p className={`${styles.panel} ${styles.empty}`}>{writable ? "No goals yet. Add the first thing you want to get done today." : "No goals for this day."}</p> : null}

    {writable && stage === "plan" ? <div className={`${styles.panel} grid gap-2 p-3.5`}>
      <Field label="Add a goal"><input className={input} value={goalDraft} maxLength={200} placeholder="e.g. Prepare Sunday’s youth teaching"
        onChange={event => setGoalDraft(event.target.value)} onKeyDown={event => { if (event.key === "Enter") { event.preventDefault(); addGoal(); } }} /></Field>
      <button type="button" className={`${styles.btn} ${styles.mini} justify-self-start`} disabled={!goalDraft.trim()} onClick={addGoal}><PlusIcon className="size-3.5" strokeWidth={2.2} />Add goal</button>
    </div> : null}
    {writable && stage === "review" && day.goals.length ? <button type="button" className={styles.btn} data-primary="" disabled={pending} onClick={submitOutcomes}>{pending ? "Saving…" : "Save end of day"}</button> : null}
    {notice ? <p className="text-[13px] leading-5 text-[var(--color-community-green-ink)]" role="status">{notice}</p> : null}
    <p className={styles.note}>{stage === "plan" && writable ? "Everything saves as you go. " : ""}This report is optional and separate from your daily report. Your leader sees it beside your daily report.</p>
  </div>;
}

/** Read-only, for the overseer's report page: each goal, its to-dos ticked or not, and what happened. */
export function NaturalAssignmentSummary({ day }: { day: NaturalAssignmentDay }) {
  return <div className="grid gap-3">
    {day.goals.map((goal, index) => <section key={goal.id} className={styles.panel} aria-label={goal.title}>
      <div className="grid gap-0.5 px-3.5 pt-3.5 pb-2">
        <span className={styles.rowMeta}>Goal {index + 1}</span>
        <span className="font-[family-name:var(--font-dashboard-heading)] text-[15px] leading-[22px] font-medium">{goal.title}</span>
      </div>
      {goal.todos.length ? <ul className={styles.list}>{goal.todos.map(todo => <li key={todo.id} className={`${styles.row} items-start`}>
        <span className="mt-0.5 grid size-[18px] shrink-0 place-items-center rounded-full border-[1.5px] text-white" aria-label={todo.done ? "Done" : "Not done"}
          style={todo.done ? { borderColor: "var(--color-community-green-ink)", background: "var(--color-community-green-ink)" } : { borderColor: "#c9ced6" }}>{todo.done ? <CheckIcon className="size-2.5" strokeWidth={3} /> : null}</span>
        <span className={`${styles.rowCopy} gap-0.5`}>
          <span className={styles.rowTitle} style={{ whiteSpace: "normal" }}>{todo.text}</span>
          {todo.deadline ? <span className={styles.rowMeta}>By {deadlineLabel(todo.deadline)}</span> : null}
        </span>
      </li>)}</ul> : null}
      {goal.outcome ? <p className="border-t border-(--color-line) px-3.5 py-3 text-[13.5px] leading-5 whitespace-pre-line">{goal.outcome}</p> : null}
    </section>)}
  </div>;
}
