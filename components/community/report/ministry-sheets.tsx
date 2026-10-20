"use client";

import { useRouter } from "next/navigation";
import { useMemo, useRef, useState, useTransition } from "react";
import { CheckIcon, ChevronDownIcon, MegaphoneIcon, PlusIcon, SearchIcon, UserRoundIcon, XIcon } from "lucide-react";

import { createPrivateContactAction, saveUnifiedMinistryAction } from "@/app/(site)/dashboard/community/_actions/reporting-v3-actions";
import { OUTREACH_PLATFORMS } from "@/lib/community/ministry-activities";
import { MINISTRY_NOTE_MAX } from "@/lib/community/ministry-report";
import { CONTACTS_PER_DAY_MAX } from "@/lib/community/outreach-contacts";
import { DIRECT_METHODS, DISCIPLESHIP_ACTIONS, PERSON_OUTCOMES, outcomeTotals, type ContactOutcomes, type DiscipleshipAction, type MinistryEdit, type PersonOutcome } from "@/lib/community/report-popups";
import type { MinistryContact } from "@/lib/community/reporting-v3";

import { ContactSheet } from "./ministry-v3/ministry-form";
import { ReportSheet, Segmented, Stepper, sheetStyles as styles } from "./report-sheet";

const COUNT_MAX = 100_000;
const OUTCOME_LABEL: Record<PersonOutcome, string> = { saved: "Saved", filled: "Filled", healed: "Healed" };
const initials = (name: string) => name.split(/\s+/).map(word => word[0]).slice(0, 2).join("").toUpperCase();
const firstName = (name: string) => name.trim().split(/\s+/)[0];
/** The saved report's own people join the choices, in case they fall outside the loaded list. */
const withSaved = (contacts: MinistryContact[], saved: MinistryContact[] = []) =>
  [...contacts, ...saved.filter(row => !contacts.some(contact => contact.key === row.key))];

/** Saves through the unified ministry action, once per sheet (the request key stops double saves). */
function useMinistrySave() {
  const router = useRouter();
  const requestKey = useRef<string | null>(null);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const save = (payload: Record<string, unknown>, done: () => void) => {
    setError(null);
    start(async () => {
      try {
        requestKey.current ??= crypto.randomUUID();
        const result = await saveUnifiedMinistryAction({ ...payload, requestKey: requestKey.current });
        if (!result.ok) { setError(result.error); return; }
        // A new entry after this one (broadcast, then one-to-one) needs its own key.
        requestKey.current = null;
        router.refresh(); done();
      } catch { setError("Your report could not be saved. Your entries are still here. Try again."); }
    });
  };
  return { pending, error, setError, save };
}

/** Find a saved contact or add a new one; picked people come back through `onPick`. */
function PeopleSearch({ contacts, picked, onPick, onCreated, placeholder = "Find a saved contact or add someone" }: {
  contacts: MinistryContact[]; picked: string[]; onPick: (contact: MinistryContact) => void;
  onCreated: (contact: MinistryContact) => void; placeholder?: string;
}) {
  const [query, setQuery] = useState("");
  const [adding, setAdding] = useState(false);
  const term = query.trim().toLowerCase();
  const matches = term ? contacts.filter(row => !picked.includes(row.key) && `${row.name} ${row.phone ?? ""}`.toLowerCase().includes(term)).slice(0, 8) : [];
  const full = picked.length >= CONTACTS_PER_DAY_MAX;
  return <>
    <label className={styles.searchBox}>
      <SearchIcon className="size-4" aria-hidden="true" />
      <span className={styles.srOnly}>Find a saved contact</span>
      <input type="search" value={query} placeholder={placeholder} disabled={full} onChange={event => setQuery(event.target.value)} />
    </label>
    {term ? <div className={`${styles.box} ${styles.results}`}>
      {matches.map(row => <button key={row.key} type="button" className={styles.result} onClick={() => { onPick(row); setQuery(""); }}>
        <span>{row.name}</span><PlusIcon className="size-4" aria-hidden="true" />
      </button>)}
      <button type="button" className={styles.result} onClick={() => setAdding(true)}><span>Add “{query.trim()}” as a new contact</span><PlusIcon className="size-4" aria-hidden="true" /></button>
    </div> : <button type="button" className={`${styles.chip} ${styles.chipAdd}`} disabled={full} onClick={() => setAdding(true)}><PlusIcon className="size-3.5" aria-hidden="true" />Add someone new</button>}
    {adding ? <ContactSheet onClose={() => setAdding(false)} onPersist={createPrivateContactAction} onAdd={contact => { onCreated(contact); setAdding(false); setQuery(""); }} /> : null}
  </>;
}

// ─── Evangelism ────────────────────────────────────────────────────────────

type Step = "kind" | "broadcast" | "direct";
type Where = "online" | "offline" | "both";
const WHERE: readonly { key: Where; label: string }[] = [{ key: "online", label: "Online" }, { key: "offline", label: "Offline" }, { key: "both", label: "Both" }];

/**
 * Evangelism (Pastor: branch by the kind of outreach). Broadcast needs no names;
 * one-to-one is about the people, each with their own saved/filled/healed.
 */
export function EvangelismSheet({ dateKey, contacts: initialContacts, initial, onClose }: {
  dateKey: string; contacts: MinistryContact[];
  /** A saved evangelism report to edit: it opens on its own style, filled in. */
  initial?: MinistryEdit; onClose: () => void;
}) {
  const edit = initial?.kind === "outreach" ? initial : undefined;
  const broadcastEdit = edit?.style === "broadcast" ? edit : undefined, directEdit = edit?.style === "direct" ? edit : undefined;
  const editWhere: Where = broadcastEdit?.method === "Online" ? "online" : broadcastEdit?.method === "Both" ? "both" : broadcastEdit ? "offline" : "online";
  const { pending, error, setError, save } = useMinistrySave();
  const [step, setStep] = useState<Step>(directEdit ? "direct" : broadcastEdit ? "broadcast" : "kind");
  // Both kinds can be picked (Pastor, 20 October): each is saved as its own entry, broadcast first.
  const [choice, setChoice] = useState<Set<"broadcast" | "direct">>(() => new Set([directEdit ? "direct" : "broadcast"]));
  const both = !edit && choice.has("broadcast") && choice.has("direct");
  const toggleChoice = (kind: "broadcast" | "direct") => setChoice(current => {
    const next = new Set(current);
    if (next.has(kind)) next.delete(kind); else next.add(kind);
    return next;
  });
  const [contacts, setContacts] = useState(() => withSaved(initialContacts, edit?.contacts));
  const [picked, setPicked] = useState<string[]>(() => edit?.contacts.map(row => row.key) ?? []);
  const [note, setNote] = useState(edit?.note ?? "");
  const [noteOpen, setNoteOpen] = useState(Boolean(edit?.note));
  // Broadcast
  const [where, setWhere] = useState<Where>(editWhere);
  const [platform, setPlatform] = useState(broadcastEdit?.platform ?? "");
  const [platformOther, setPlatformOther] = useState(broadcastEdit?.platformOther ?? "");
  const [place, setPlace] = useState(edit?.context ?? "");
  // A broadcast's reach is an estimate and may be left blank (saved as 0), so 0 reopens blank.
  const count = (n: number | undefined) => n ? String(n) : "";
  const [reached, setReached] = useState(editWhere !== "both" ? count(broadcastEdit?.peopleCount) : "");
  const [online, setOnline] = useState(editWhere === "both" ? count(broadcastEdit?.onlineCount) : "");
  const [offline, setOffline] = useState(editWhere === "both" ? count(broadcastEdit?.offlineCount) : "");
  const savedOutcomes = (key: PersonOutcome) => broadcastEdit?.outcomes[key] ?? "";
  const [outcomesOpen, setOutcomesOpen] = useState(PERSON_OUTCOMES.some(key => savedOutcomes(key)));
  const [outcomes, setOutcomes] = useState<Record<PersonOutcome, string>>({ saved: savedOutcomes("saved"), filled: savedOutcomes("filled"), healed: savedOutcomes("healed") });
  // Numbers the sheet doesn't show (an older report's "not saved") are kept as they were.
  const keptOutcomes = Object.fromEntries(Object.entries(broadcastEdit?.outcomes ?? {}).filter(([key, value]) => value && !(PERSON_OUTCOMES as readonly string[]).includes(key)));
  // One-to-one
  const [method, setMethod] = useState<(typeof DIRECT_METHODS)[number]>(DIRECT_METHODS.find(value => value === directEdit?.method) ?? "In person");
  const [ticks, setTicks] = useState<ContactOutcomes>(directEdit?.contactOutcomes ?? {});
  const [others, setOthers] = useState(directEdit ? Math.max(0, directEdit.peopleCount - directEdit.contacts.length) : 0);

  const byKey = useMemo(() => new Map(contacts.map(row => [row.key, row])), [contacts]);
  const pick = (contact: MinistryContact) => setPicked(current => current.includes(contact.key) ? current : [...current, contact.key]);
  const created = (contact: MinistryContact) => { setContacts(current => [...current, contact]); pick(contact); };
  const unpick = (key: string) => { setPicked(current => current.filter(row => row !== key)); setTicks(({ [key]: _gone, ...rest }) => rest); };
  const toggleTick = (key: string, tick: PersonOutcome) => setTicks(current => {
    const now = current[key] ?? [];
    return { ...current, [key]: now.includes(tick) ? now.filter(row => row !== tick) : [...now, tick] };
  });
  const totals = outcomeTotals(ticks);
  const directCount = picked.length + others;

  const noteField = noteOpen
    ? <label className={styles.field}><span className={styles.label}>Note <em>Optional</em></span><textarea className={styles.textarea} maxLength={MINISTRY_NOTE_MAX} value={note} onChange={event => setNote(event.target.value)} /></label>
    : null;

  function saveBroadcast(close: () => void) {
    // Sent to an unknown number of people: the estimate is optional, and blank means not counted.
    const total = where === "both" ? (Number(online) || 0) + (Number(offline) || 0) : Number(reached) || 0;
    if (total > 0 && total < picked.length) { setError("Include the people you named in the total."); return; }
    const peopleCount = Math.max(total, picked.length);
    save({
      dateKey, activityId: edit?.activityId, kind: "outreach", style: "broadcast", method: where === "online" ? "Online" : where === "both" ? "Both" : "In person",
      context: where === "online" ? "" : place, platform: where === "offline" ? "" : platform, platformOther,
      peopleCount, onlineCount: where === "both" && !total ? String(peopleCount) : online || "0", offlineCount: offline || "0", contacts: picked,
      outcomes: { ...keptOutcomes, ...Object.fromEntries(Object.entries(outcomes).filter(([, value]) => value.trim())) }, note,
    }, close);
  }
  function saveDirect(close: () => void) {
    if (directCount < 1) { setError("Add the people you spoke with, or count those whose names you didn’t get."); return; }
    save({ dateKey, activityId: edit?.activityId, kind: "outreach", style: "direct", method, context: method === "In person" || method === "Visit" ? place : "", peopleCount: directCount, contacts: picked, contactOutcomes: ticks, note }, close);
  }

  if (step === "kind") return <ReportSheet title="Evangelism" subtitle="What kind of outreach was it?" onClose={onClose}
    footer={() => <button type="button" className={styles.primary} disabled={!choice.size} onClick={() => { setError(null); setStep(choice.has("broadcast") ? "broadcast" : "direct"); }}>Continue</button>}>
    {() => <>
      <button type="button" className={styles.kind} aria-pressed={choice.has("broadcast")} onClick={() => toggleChoice("broadcast")}>
        <span className={styles.kindIcon} style={{ background: "#e4ebfd", color: "#2331ae" }} aria-hidden="true"><MegaphoneIcon className="size-5" /></span>
        <span><h3>Broadcast</h3><p>You shared the gospel with many at once. No names needed.</p>
          <span className={styles.examples}><span>Status or post</span><span>Live</span><span>Street preaching</span><span>Bus or market</span></span></span>
      </button>
      <button type="button" className={styles.kind} aria-pressed={choice.has("direct")} onClick={() => toggleChoice("direct")}>
        <span className={styles.kindIcon} style={{ background: "#dcefe3", color: "#1f6b45" }} aria-hidden="true"><UserRoundIcon className="size-5" /></span>
        <span><h3>One-to-one</h3><p>You spoke with specific people. Add them so you can follow them up.</p>
          <span className={styles.examples}><span>Conversation</span><span>Call or chat</span><span>Visit</span></span></span>
      </button>
      <p className={styles.hint}>Did both today? Choose both, and you’ll fill in each in turn.</p>
    </>}
  </ReportSheet>;

  if (step === "broadcast") return <ReportSheet title="Broadcast" subtitle="Shared with many at once" back="Evangelism" onBack={() => setStep("kind")} onClose={onClose}
    footer={close => <button type="button" className={styles.primary} disabled={pending} onClick={() => saveBroadcast(both ? () => {
      // The one-to-one part starts with its own people and note.
      setPicked([]); setNote(""); setNoteOpen(false); setTicks({}); setOthers(0); setPlace(""); setStep("direct");
    } : close)}>{pending ? "Saving…" : edit ? "Save changes" : both ? "Save and continue to one-to-one" : "Save broadcast"}</button>}>
    {() => <>
      <div className={styles.field}><span className={styles.label}>Where?</span><Segmented label="Where" options={WHERE} value={where} onChange={setWhere} /></div>
      {where !== "offline" ? <label className={styles.field}><span className={styles.label}>Platform</span>
        <select className={styles.select} value={platform} onChange={event => setPlatform(event.target.value)}>
          <option value="">Choose a platform</option>
          {OUTREACH_PLATFORMS.map(row => <option key={row.key} value={row.key}>{row.label}</option>)}
        </select>
      </label> : null}
      {where !== "offline" && platform === "other" ? <label className={styles.field}><span className={styles.label}>Which platform?</span><input className={styles.input} maxLength={120} value={platformOther} onChange={event => setPlatformOther(event.target.value)} /></label> : null}
      {where !== "online" ? <label className={styles.field}><span className={styles.label}>Where were you?</span><input className={styles.input} maxLength={120} value={place} placeholder="For example, Yaba market" onChange={event => setPlace(event.target.value)} /></label> : null}
      {where === "both" ? <div className={styles.row}>
        <label className={styles.field} style={{ flex: 1 }}><span className={styles.label}>Reached online <em>Optional</em></span><input className={styles.input} inputMode="numeric" value={online} onChange={event => setOnline(event.target.value.replace(/\D/g, ""))} /></label>
        <label className={styles.field} style={{ flex: 1 }}><span className={styles.label}>Reached offline <em>Optional</em></span><input className={styles.input} inputMode="numeric" value={offline} onChange={event => setOffline(event.target.value.replace(/\D/g, ""))} /></label>
      </div> : <label className={styles.field}><span className={styles.label}>About how many people saw or heard it? <em>Optional</em></span>
        <input className={styles.input} inputMode="numeric" value={reached} onChange={event => setReached(event.target.value.replace(/\D/g, ""))} />
        <span className={styles.hint}>Leave it blank if you can’t tell. A rough estimate is fine{where === "online" ? ", for example views on your status" : ""}.</span>
      </label>}
      <button type="button" className={styles.disclosure} aria-expanded={outcomesOpen} onClick={() => setOutcomesOpen(open => !open)}>
        <span className={styles.lineCopy}><span className={styles.lineTitle}>Anyone respond?</span><span className={styles.hint}>Saved, filled or healed · optional</span></span>
        <ChevronDownIcon className="size-4" aria-hidden="true" />
      </button>
      {outcomesOpen ? <div className={styles.outcomes}>
        {PERSON_OUTCOMES.map(key => <label key={key} className={styles.field}><span className={styles.label}>{OUTCOME_LABEL[key]}</span><input className={styles.input} inputMode="numeric" value={outcomes[key]} onChange={event => setOutcomes(current => ({ ...current, [key]: event.target.value.replace(/\D/g, "") }))} /></label>)}
        <p className={styles.hint} style={{ gridColumn: "1 / -1" }}>Saved: believed the Gospel. Filled: filled with the Holy Ghost. Healed: testified they were healed after prayer.</p>
      </div> : null}
      <div className={styles.field}>
        <span className={styles.label}>Got someone’s name? <em>Optional</em></span>
        {picked.length ? <div className={styles.chips}>{picked.map(key => <button key={key} type="button" className={styles.chip} aria-pressed="true" onClick={() => unpick(key)} aria-label={`Remove ${byKey.get(key)?.name ?? "contact"}`}><span>{byKey.get(key)?.name}</span><XIcon className="size-3.5" aria-hidden="true" /></button>)}</div> : null}
        <PeopleSearch contacts={contacts} picked={picked} onPick={pick} onCreated={created} placeholder="Find a saved contact" />
        <span className={styles.hint}>Add them to your contacts to follow up.</span>
      </div>
      {noteField}
      {noteOpen ? null : <button type="button" className={styles.quiet} style={{ justifySelf: "start" }} onClick={() => setNoteOpen(true)}>Add a note</button>}
      {error ? <p role="alert" className={styles.error}>{error}</p> : null}
    </>}
  </ReportSheet>;

  return <ReportSheet title="One-to-one" subtitle="The people you spoke with" back="Evangelism" onBack={() => setStep("kind")} onClose={onClose}
    footer={close => <button type="button" className={styles.primary} disabled={pending} onClick={() => saveDirect(close)}>{pending ? "Saving…" : edit ? "Save changes" : "Save one-to-one"}</button>}>
    {() => <>
      <div className={styles.field}><span className={styles.label}>How?</span>
        <div className={styles.chips}>{DIRECT_METHODS.map(value => <button key={value} type="button" className={styles.chip} aria-pressed={method === value} onClick={() => setMethod(value)}>{value}</button>)}</div>
      </div>
      {method === "In person" || method === "Visit" ? <label className={styles.field}><span className={styles.label}>Where?</span><input className={styles.input} maxLength={120} value={place} placeholder="For example, at work" onChange={event => setPlace(event.target.value)} /></label> : null}
      <div className={styles.field}><span className={styles.label}>Who did you speak with?</span>
        <PeopleSearch contacts={contacts} picked={picked} onPick={pick} onCreated={created} />
        {picked.length ? <div className={styles.box}>{picked.map(key => {
          const person = byKey.get(key);
          return <div key={key} className={styles.line}>
            <span className={styles.avatar} aria-hidden="true">{initials(person?.name ?? "?")}</span>
            <span className={styles.lineCopy}><span className={styles.lineTitle}>{person?.name}</span>
              <span className={styles.mini} role="group" aria-label={`What happened with ${person?.name}`}>
                {PERSON_OUTCOMES.map(tick => <button key={tick} type="button" aria-pressed={(ticks[key] ?? []).includes(tick)} onClick={() => toggleTick(key, tick)}>{OUTCOME_LABEL[tick]}</button>)}
              </span>
            </span>
            <button type="button" className={styles.iconButton} onClick={() => unpick(key)} aria-label={`Remove ${person?.name}`}><XIcon className="size-4" aria-hidden="true" /></button>
          </div>;
        })}</div> : null}
      </div>
      <div className={styles.field}><span className={styles.label}>Others whose names you didn’t get</span>
        <Stepper label="Others whose names you didn’t get" value={others} max={COUNT_MAX} onChange={setOthers} />
      </div>
      <div className={styles.summary}>
        <span>{directCount} {directCount === 1 ? "person" : "people"} reached{totals.saved ? ` · ${totals.saved} saved` : ""}{totals.filled ? ` · ${totals.filled} filled` : ""}{totals.healed ? ` · ${totals.healed} healed` : ""}</span>
        {noteOpen ? null : <button type="button" className={styles.quiet} onClick={() => setNoteOpen(true)}>Add a note</button>}
      </div>
      {noteField}
      {error ? <p role="alert" className={styles.error}>{error}</p> : null}
    </>}
  </ReportSheet>;
}

// ─── Discipleship ──────────────────────────────────────────────────────────

const HOW = [{ key: "In person", label: "In person" }, { key: "Phone call", label: "Call" }, { key: "WhatsApp", label: "WhatsApp" }] as const;
type How = (typeof HOW)[number]["key"];

/** Discipleship (Pastor: tickable choices instead of writing it out). Always specific people, never a broadcast. */
export function DiscipleshipSheet({ dateKey, contacts: initialContacts, teachings, initial, onClose }: {
  dateKey: string; contacts: MinistryContact[];
  /** This week's SOGP teaching titles, offered as one-tap answers to "What did you teach?". */
  teachings: string[];
  /** A saved discipleship report to edit, filled in. */
  initial?: MinistryEdit; onClose: () => void;
}) {
  const edit = initial?.kind === "follow_up" ? initial : undefined;
  const editTaught = edit?.actions.includes("taught") ? edit.context : "";
  const { pending, error, setError, save } = useMinistrySave();
  const [contacts, setContacts] = useState(() => withSaved(initialContacts, edit?.contacts));
  const [actions, setActions] = useState<DiscipleshipAction[]>(edit?.actions ?? []);
  const [taught, setTaught] = useState<string>(editTaught);
  const [ownSubject, setOwnSubject] = useState(Boolean(editTaught) && !teachings.includes(editTaught));
  const [picked, setPicked] = useState<string[]>(() => edit?.contacts.map(row => row.key) ?? []);
  const [others, setOthers] = useState(edit ? Math.max(0, edit.peopleCount - edit.contacts.length) : 0);
  const [how, setHow] = useState<How>(HOW.find(row => row.key === edit?.method)?.key ?? "In person");
  const [note, setNote] = useState(edit?.note ?? "");
  const [noteOpen, setNoteOpen] = useState(Boolean(edit?.note));
  const byKey = useMemo(() => new Map(contacts.map(row => [row.key, row])), [contacts]);
  // The people you report on most often come first: those already picked, then the start of your list.
  const suggestions = [...picked, ...contacts.map(row => row.key).filter(key => !picked.includes(key)).slice(0, Math.max(0, 6 - picked.length))];
  const toggle = (key: string) => setPicked(current => current.includes(key) ? current.filter(row => row !== key) : [...current, key]);
  const toggleAction = (key: DiscipleshipAction) => setActions(current => current.includes(key) ? current.filter(row => row !== key) : [...current, key]);
  const count = picked.length + others;

  function submit(close: () => void) {
    if (!actions.length) { setError("Tick at least one thing you did."); return; }
    if (count < 1) { setError("Choose who you discipled."); return; }
    save({ dateKey, activityId: edit?.activityId, kind: "follow_up", method: how, actions, context: actions.includes("taught") ? taught : "", peopleCount: count, contacts: picked, note }, close);
  }

  return <ReportSheet title="Discipleship" subtitle="Tick what you did. No need to write it out." onClose={onClose}
    footer={close => <button type="button" className={styles.primary} disabled={pending} onClick={() => submit(close)}>{pending ? "Saving…" : edit ? "Save changes" : "Save discipleship"}</button>}>
    {() => <>
      <div className={styles.field}><span className={styles.label}>What did you do?</span>
        <div className={styles.chips}>{DISCIPLESHIP_ACTIONS.map(row => {
          const on = actions.includes(row.key);
          return <button key={row.key} type="button" className={styles.chip} aria-pressed={on} onClick={() => toggleAction(row.key)}>{on ? <CheckIcon className="size-3.5" strokeWidth={2.6} aria-hidden="true" /> : null}{row.label}</button>;
        })}</div>
      </div>
      {actions.includes("taught") ? <div className={styles.field}><span className={styles.label}>What did you teach? <em>Optional</em></span>
        <div className={styles.chips}>
          {teachings.map(title => <button key={title} type="button" className={styles.chip} aria-pressed={!ownSubject && taught === title} onClick={() => { setOwnSubject(false); setTaught(current => current === title ? "" : title); }}><span>{title}</span></button>)}
          <button type="button" className={styles.chip} aria-pressed={ownSubject} onClick={() => { setOwnSubject(true); setTaught(""); }}>Something else</button>
        </div>
        {ownSubject ? <input className={styles.input} maxLength={120} value={taught} placeholder="The topic or passage" aria-label="What you taught" onChange={event => setTaught(event.target.value)} /> : null}
      </div> : null}
      <div className={styles.field}><span className={styles.label}>With whom?</span>
        {suggestions.length ? <div className={styles.chips}>{suggestions.map(key => <button key={key} type="button" className={styles.chip} aria-pressed={picked.includes(key)} onClick={() => toggle(key)}><span>{firstName(byKey.get(key)?.name ?? "")}</span></button>)}</div> : null}
        <PeopleSearch contacts={contacts} picked={picked} onPick={contact => toggle(contact.key)} onCreated={contact => { setContacts(current => [...current, contact]); toggle(contact.key); }} placeholder="Find someone else" />
      </div>
      <div className={styles.field}><span className={styles.label}>Others not on your list <em>Optional</em></span>
        <Stepper label="Others not on your list" value={others} max={COUNT_MAX} onChange={setOthers} />
      </div>
      <div className={styles.field}><span className={styles.label}>How?</span><Segmented label="How" options={HOW} value={how} onChange={setHow} /></div>
      {noteOpen
        ? <label className={styles.field}><span className={styles.label}>Note <em>Optional</em></span><textarea className={styles.textarea} maxLength={MINISTRY_NOTE_MAX} value={note} onChange={event => setNote(event.target.value)} /></label>
        : <button type="button" className={styles.quiet} style={{ justifySelf: "start" }} onClick={() => setNoteOpen(true)}>Add a note</button>}
      {error ? <p role="alert" className={styles.error}>{error}</p> : null}
    </>}
  </ReportSheet>;
}
