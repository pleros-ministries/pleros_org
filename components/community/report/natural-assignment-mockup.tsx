"use client";

import { useState } from "react";
import { CheckIcon, ChevronRightIcon, ClockIcon, PlusIcon, TargetIcon, Trash2Icon } from "lucide-react";

import styles from "@/components/community/discipleship/discipleship-group.module.css";

/**
 * Mockup for the Pastor's 20 October review: an optional natural assignment
 * report, kept under "Other reports" rather than on the daily report itself.
 * Morning: goals, each with to-dos and a deadline. Through the day: tick the
 * to-dos. Evening: what happened against each goal. Sample data only.
 */

type Todo = { id: string; text: string; deadline: string; done: boolean };
type Goal = { id: string; title: string; todos: Todo[]; outcome: string };

const START: Goal[] = [
  { id: "a", title: "Prepare Sunday's youth teaching", outcome: "", todos: [
    { id: "a1", text: "Read Ephesians 2 and outline three points", deadline: "10:00 am", done: true },
    { id: "a2", text: "Send the outline to Pastor for review", deadline: "2:00 pm", done: false },
  ] },
  { id: "b", title: "Follow up this week's new believers", outcome: "", todos: [
    { id: "b1", text: "Call Chidi and Ruth", deadline: "5:00 pm", done: false },
    { id: "b2", text: "Invite them to Thursday's Bible study", deadline: "6:00 pm", done: false },
  ] },
];

/** The "Other reports" card at the foot of My reports. Optional: nothing here counts towards the daily report. */
export function OtherReportsEntry({ onOpen }: { onOpen: () => void }) {
  return <section aria-labelledby="other-reports">
    <div className={styles.sectionTitle}><h2 id="other-reports">Other reports</h2><span className={styles.rowMeta}>Optional</span></div>
    <div className={`${styles.panel} mt-3`}>
      <button type="button" className={`${styles.row} w-full text-left`} onClick={onOpen}>
        <span className="grid size-9 shrink-0 place-items-center rounded-[10px] bg-[#e4ebfd] text-[#2331ae]" aria-hidden="true"><TargetIcon className="size-4" strokeWidth={2.2} /></span>
        <span className={styles.rowCopy}><span className={styles.rowTitle}>Natural assignment</span><span className={styles.rowMeta}>Your goals, to-dos and deadlines for the day</span></span>
        <ChevronRightIcon className={`${styles.chev} size-4`} strokeWidth={2} />
      </button>
    </div>
  </section>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="grid gap-1.5 text-[13px] font-medium text-[var(--color-community-ink)]">{label}{children}</label>;
}
const input = "h-10 w-full rounded-[10px] border border-[var(--dashboard-panel-edge,#e2e5ea)] bg-white px-3 text-[16px] font-normal outline-none focus:border-[var(--color-community-blue)]";

export function NaturalAssignmentMockup() {
  const [goals, setGoals] = useState<Goal[]>(START);
  const [stage, setStage] = useState<"plan" | "review">("plan");
  const [draft, setDraft] = useState<Record<string, { text: string; deadline: string }>>({});
  const todos = goals.flatMap(goal => goal.todos);
  const finished = todos.filter(todo => todo.done).length;
  const update = (goalId: string, change: (goal: Goal) => Goal) => setGoals(current => current.map(goal => goal.id === goalId ? change(goal) : goal));

  return <div className={`${styles.page} mx-auto w-full max-w-[640px] px-4 pt-[18px] pb-7`}>
    <div className={styles.heading}><div><h1 className="m-0 font-[family-name:var(--font-dashboard-heading)] text-[21px] leading-7 font-medium">Natural assignment</h1><p className={styles.sub}>Tuesday 20 October · optional</p></div></div>
    <div className="grid grid-cols-2 rounded-[10px] bg-[#eceef2] p-[3px]" role="tablist" aria-label="Part of the day">
      {([["plan", "Plan the day"], ["review", "End of day"]] as const).map(([key, label]) => <button key={key} type="button" role="tab" aria-selected={stage === key} onClick={() => setStage(key)}
        className={`inline-flex h-8 items-center justify-center rounded-[7px] text-[13px] font-medium ${stage === key ? "bg-white text-[var(--color-community-ink)] shadow-[0_1px_2px_rgb(0_0_0/8%)]" : "text-[var(--color-community-muted)]"}`}>{label}</button>)}
    </div>
    <div className={styles.strip}>
      <div><span>Goals</span><strong>{goals.length}</strong></div>
      <div><span>To-dos done</span><strong>{finished}/{todos.length}</strong></div>
      <div><span>Next deadline</span><strong style={{ fontSize: 15 }}>{todos.find(todo => !todo.done)?.deadline ?? "—"}</strong></div>
    </div>

    {goals.map((goal, index) => <section key={goal.id} className={styles.panel} aria-label={goal.title}>
      <div className="grid gap-0.5 px-3.5 pt-3.5 pb-2">
        <span className={styles.rowMeta}>Goal {index + 1}</span>
        <span className="font-[family-name:var(--font-dashboard-heading)] text-[15px] leading-[22px] font-medium">{goal.title}</span>
      </div>
      <ul className={styles.list}>{goal.todos.map(todo => <li key={todo.id}><div className={`${styles.row} items-start`}>
        <button type="button" aria-pressed={todo.done} aria-label={todo.done ? `Undo: ${todo.text}` : `Done: ${todo.text}`}
          onClick={() => update(goal.id, current => ({ ...current, todos: current.todos.map(item => item.id === todo.id ? { ...item, done: !item.done } : item) }))}
          className="mt-0.5 grid size-[22px] shrink-0 place-items-center rounded-full border-[1.5px] text-white"
          style={todo.done ? { borderColor: "var(--color-community-blue, #2056d6)", background: "var(--color-community-blue, #2056d6)" } : { borderColor: "#c9ced6" }}>
          {todo.done ? <CheckIcon className="size-3" strokeWidth={3} /> : null}
        </button>
        <span className={`${styles.rowCopy} gap-0.5`}>
          <span className={styles.rowTitle} style={{ whiteSpace: "normal", textDecoration: todo.done ? "line-through" : undefined, color: todo.done ? "var(--color-community-muted)" : undefined }}>{todo.text}</span>
          <span className={`${styles.rowMeta} inline-flex items-center gap-1`}><ClockIcon className="size-3" strokeWidth={2.2} />By {todo.deadline}</span>
        </span>
        {stage === "plan" ? <button type="button" className="grid size-8 shrink-0 place-items-center rounded-full text-[var(--color-community-muted)]" aria-label={`Remove: ${todo.text}`}
          onClick={() => update(goal.id, current => ({ ...current, todos: current.todos.filter(item => item.id !== todo.id) }))}><Trash2Icon className="size-4" strokeWidth={2} /></button> : null}
      </div></li>)}</ul>
      {stage === "plan" ? <div className="grid gap-2 border-t border-(--color-line) p-3.5">
        <div className="grid grid-cols-[1fr_auto] gap-2">
          <Field label="Add a to-do"><input className={input} value={draft[goal.id]?.text ?? ""} placeholder="What will you do?" onChange={event => setDraft(current => ({ ...current, [goal.id]: { deadline: current[goal.id]?.deadline ?? "", text: event.target.value } }))} /></Field>
          <Field label="By"><input className={input} type="time" value={draft[goal.id]?.deadline ?? ""} onChange={event => setDraft(current => ({ ...current, [goal.id]: { text: current[goal.id]?.text ?? "", deadline: event.target.value } }))} /></Field>
        </div>
        <button type="button" className={`${styles.btn} ${styles.mini} justify-self-start`} disabled={!draft[goal.id]?.text?.trim()} onClick={() => {
          const entry = draft[goal.id]!;
          update(goal.id, current => ({ ...current, todos: [...current.todos, { id: `${goal.id}${Date.now()}`, text: entry.text.trim(), deadline: entry.deadline || "end of day", done: false }] }));
          setDraft(current => ({ ...current, [goal.id]: { text: "", deadline: "" } }));
        }}><PlusIcon className="size-3.5" strokeWidth={2.2} />Add to-do</button>
      </div> : <div className="border-t border-(--color-line) p-3.5">
        <Field label="What happened?"><textarea className={`${input} h-auto min-h-[72px] py-2`} value={goal.outcome} placeholder="What you did against this goal, and what's left" onChange={event => update(goal.id, current => ({ ...current, outcome: event.target.value }))} /></Field>
      </div>}
    </section>)}

    {stage === "plan" ? <button type="button" className={`${styles.btn} justify-self-start`} onClick={() => setGoals(current => [...current, { id: `g${Date.now()}`, title: "New goal", todos: [], outcome: "" }])}><PlusIcon className="size-3.5" strokeWidth={2.2} />Add a goal</button> : null}
    <button type="button" className={styles.btn} data-primary="">{stage === "plan" ? "Save my plan" : "Submit end of day"}</button>
    <p className={styles.note}>This report is optional and separate from your daily report. Your leader sees it alongside your daily report.</p>
  </div>;
}
