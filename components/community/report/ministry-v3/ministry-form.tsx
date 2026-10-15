"use client";

import { startTransition, useEffect, useRef, useState } from "react";
import { DashboardIcon } from "@/components/dashboard/v3/primitives";
import { normalisePrivateContact, validateMinistryPeople, validateEnteredOutcomes, type MinistryContact, type PrivateContactInput } from "@/lib/community/reporting-v3";
import { CONTACTS_PER_DAY_MAX, CONTACT_NAME_MAX, CONTACT_PHONE_MAX, CONTACT_NOTE_MAX } from "@/lib/community/outreach-contacts";
import { MINISTRY_FIELDS, MINISTRY_NOTE_MAX, type MinistryFieldKey } from "@/lib/community/ministry-report";
import { OUTREACH_PLATFORMS } from "@/lib/community/ministry-activities";
import styles from "./ministry-form.module.css";
import { ReportDateLine } from "./report-date";

type ContactDraft = { name: string; phone: string; email: string; note: string };
type ContactError = { field: keyof ContactDraft; message: string };
export type MinistryFormPayload = {
  dateKey: string; kind: "outreach" | "follow_up"; method: string; context: string;
  peopleCount: number; contacts: MinistryContact[]; note: string;
  /** Blank optional metrics stay unspecified until their approved persistence mapping is applied. */
  outcomes: Partial<Record<MinistryFieldKey, string>>;
  platform?: string; platformOther?: string; onlineCount?: string; offlineCount?: string;
};
export type PersistContact = (input: PrivateContactInput & { requestKey: string }) => Promise<{ ok: true; value: MinistryContact } | { ok: false; error: string }>;
const emptyContact: ContactDraft = { name: "", phone: "", email: "", note: "" };

export function PrivateContactFields({ value, update, error }: {
  value: ContactDraft; update: (patch: Partial<ContactDraft>) => void; error?: ContactError;
}) {
  return <div className={styles.contactFields}>
    {([ ["name", "Full name · required", "text", CONTACT_NAME_MAX], ["phone", "Phone number · required", "tel", CONTACT_PHONE_MAX], ["email", "Email · optional", "email", 254] ] as const).map(([key, label, type, maxLength]) => {
      const id = `private-contact-${key}`;
      return <label key={key} className={styles.field} htmlFor={id}>{label}
        <input id={id} type={type} inputMode={key === "phone" ? "tel" : key === "email" ? "email" : "text"} maxLength={maxLength} value={value[key]} onChange={event => update({ [key]: event.target.value })} aria-invalid={error?.field === key || undefined} aria-describedby={error?.field === key ? `${id}-error` : undefined} />
        {error?.field === key ? <span id={`${id}-error`} className={styles.error}>{error.message}</span> : null}
      </label>;
    })}
    <label className={styles.field} htmlFor="private-contact-note">Contact note · optional
      <textarea id="private-contact-note" rows={4} maxLength={CONTACT_NOTE_MAX} value={value.note} onChange={event => update({ note: event.target.value })} aria-invalid={error?.field === "note" || undefined} aria-describedby={error?.field === "note" ? "private-contact-note-error" : undefined} />
      {error?.field === "note" ? <span id="private-contact-note-error" className={styles.error}>{error.message}</span> : null}
    </label>
  </div>;
}

export function ContactSheet({ onClose, onAdd, onPersist, standalone = false }: { onClose: () => void; onAdd: (contact: MinistryContact) => void; onPersist?: PersistContact; standalone?: boolean }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [value, setValue] = useState(emptyContact);
  const [error, setError] = useState<ContactError>();
  const [serverError, setServerError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const requestKey = useRef<string | null>(null);
  const submitting = useRef(false);
  useEffect(() => {
    dialog.current?.showModal();
    dialog.current?.querySelector<HTMLInputElement>("#private-contact-name")?.focus();
  }, []);
  return <dialog ref={dialog} className={styles.sheet} aria-labelledby="add-contact-title" onCancel={event => { if (busy) event.preventDefault(); else onClose(); }} onClose={onClose}>
    <form noValidate onSubmit={event => {
      event.preventDefault();
      if (submitting.current) return;
      const parsed = normalisePrivateContact(value);
      if (!parsed.ok) {
        setError({ field: parsed.field, message: parsed.error });
        requestAnimationFrame(() => document.getElementById(`private-contact-${parsed.field}`)?.focus());
        return;
      }
      setError(undefined);
      if (!onPersist) { onAdd({ ...parsed.value, key: crypto.randomUUID() }); return; }
      requestKey.current ??= crypto.randomUUID();
      submitting.current = true; setBusy(true); setServerError(null);
      startTransition(async () => {
        try {
          const result = await onPersist({ ...parsed.value, requestKey: requestKey.current! });
          if (result.ok) onAdd(result.value); else setServerError(result.error);
        } catch { setServerError("Your contact could not be saved. Your entries are still here. Try again."); }
        finally { submitting.current = false; setBusy(false); }
      });
    }}>
      <button type="button" disabled={busy} onClick={onClose} className={styles.close} aria-label="Close add contact"><DashboardIcon name="close" /></button>
      <h2 id="add-contact-title">Add a contact</h2>
      <p className={styles.muted}>{standalone ? "Save privately, without creating an account." : "Save and use in this report."}</p>
      <fieldset className={styles.contactFields} disabled={busy}><legend className={styles.srOnly}>Contact details</legend><PrivateContactFields value={value} update={patch => setValue(current => ({ ...current, ...patch }))} error={error} /></fieldset>
      <p className={styles.privacy}>This saved contact is private to you.<br />{standalone ? "" : "They’ll be selected for this report."}<br />No account or invitation is created; no message is sent.</p>
      {serverError ? <p className={styles.error} role="alert">{serverError}</p> : null}
      <p className={styles.muted}>{standalone ? "Saving does not enrol or invite this person." : "You’ll return to your report after saving."}</p>
      <button className={styles.primary} disabled={busy} type="submit">{busy ? "Saving…" : standalone ? "Save contact" : "Save & add to report"}<DashboardIcon name="check" /></button>
    </form>
  </dialog>;
}

/** Persistence is supplied by an adapter; this presenter never imports DB/auth/actions. */
export function MinistryFormV3({ dateKey, today, days, onDayChange, initialKind = "outreach", initialContacts = [], initialCount = "", onSave, savedContacts = [], onCreateContact, initialDetails, readOnly = false, lockKind = false }: {
  dateKey: string; today?: string; days?: string[]; onDayChange?: (dateKey: string) => void; initialKind?: "outreach" | "follow_up"; initialContacts?: MinistryContact[]; initialCount?: string;
  onSave: (payload: MinistryFormPayload) => Promise<{ ok: true } | { ok: false; error: string }>;
  savedContacts?: MinistryContact[]; onCreateContact?: PersistContact; readOnly?: boolean; lockKind?: boolean;
  initialDetails?: Partial<Omit<MinistryFormPayload, "dateKey" | "kind" | "contacts" | "peopleCount">>;
}) {
  const [kind, setKind] = useState(initialKind);
  const [count, setCount] = useState(initialCount);
  const [method, setMethod] = useState(initialDetails?.method ?? "In person");
  const [context, setContext] = useState(initialDetails?.context ?? "");
  const [contacts, setContacts] = useState(initialContacts);
  const [query, setQuery] = useState("");
  const [note, setNote] = useState(initialDetails?.note ?? "");
  const [outcomes, setOutcomes] = useState<MinistryFormPayload["outcomes"]>(initialDetails?.outcomes ?? {});
  const [sources, setSources] = useState(savedContacts);
  const [platform, setPlatform] = useState(initialDetails?.platform ?? "");
  const [platformOther, setPlatformOther] = useState(initialDetails?.platformOther ?? "");
  const [onlineCount, setOnlineCount] = useState(initialDetails?.onlineCount ?? "");
  const [offlineCount, setOfflineCount] = useState(initialDetails?.offlineCount ?? "");
  const [sheet, setSheet] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countError, setCountError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const saveLock = useRef(false);
  const addButton = useRef<HTMLButtonElement>(null);
  const totalInput = useRef<HTMLInputElement>(null);
  const outcomesDetails = useRef<HTMLDetailsElement>(null);
  const [outcomeError, setOutcomeError] = useState<{ field: MinistryFieldKey; error: string } | null>(null);
  const visible = contacts.filter(contact => `${contact.name} ${contact.phone}`.toLowerCase().includes(query.trim().toLowerCase()));
  const selected = new Set(contacts.map(row => row.key));
  const choices = sources.filter(row => !selected.has(row.key) && `${row.name} ${row.phone ?? ""}`.toLowerCase().includes(query.trim().toLowerCase())).slice(0, 20);
  function closeSheet() {
    setSheet(false);
    requestAnimationFrame(() => addButton.current?.focus());
  }
  async function save() {
    if (saveLock.current || saved || readOnly) return;
    const invalid = validateMinistryPeople(count, contacts);
    setCountError(invalid);
    if (invalid) { totalInput.current?.focus(); return; }
    const invalidOutcome = validateEnteredOutcomes(outcomes);
    setOutcomeError(invalidOutcome);
    if (invalidOutcome) {
      if (outcomesDetails.current) outcomesDetails.current.open = true;
      requestAnimationFrame(() => document.getElementById(`ministry-${invalidOutcome.field}`)?.focus());
      return;
    }
    saveLock.current = true; setSaving(true); setError(null);
    startTransition(async () => { try {
      const result = await onSave({ dateKey, kind, method, context, peopleCount: Number(count), contacts, outcomes, note, platform, platformOther, onlineCount, offlineCount });
      if (!result.ok) setError(result.error); else setSaved(true);
    } catch { setError("Your report could not be saved. Your entries are still here. Try again."); }
    finally { saveLock.current = false; setSaving(false); } });
  }
  return <div className={styles.form} aria-busy={saving}>
    <fieldset className={styles.controls} disabled={saving || saved || readOnly}><legend className={styles.srOnly}>Ministry report</legend>
    <ReportDateLine dateKey={dateKey} today={today} days={days} onChange={onDayChange} />
    <h1>One simple report</h1>
    <fieldset className={styles.kind}><legend className={styles.srOnly}>Ministry activity</legend>
      {([ ["outreach", "Evangelism"], ["follow_up", "Discipleship"] ] as const).map(([key, label]) => <label key={key}>
        <input type="radio" name="ministry-kind" value={key} checked={kind === key} disabled={saving || saved || lockKind} onChange={() => { setKind(key); setMethod("In person"); setOutcomes({}); setCount(""); }} /><span>{label}</span>
      </label>)}
    </fieldset>
    <label className={styles.field} htmlFor="ministry-method">How did you connect?
      <select id="ministry-method" value={method} onChange={event => setMethod(event.target.value)}>{(kind === "outreach" ? ["In person", "Online", "Both"] : ["In person", "Phone call", "WhatsApp", "Mixed methods"]).map(value => <option key={value}>{value}</option>)}</select>
    </label>
    <label className={styles.field} htmlFor="ministry-context">{kind === "outreach" && method !== "Online" ? "Where? *" : "Context · optional"}
      <input id="ministry-context" value={context} maxLength={120} onChange={event => setContext(event.target.value)} />
    </label>
    {kind === "outreach" && method !== "In person" ? <div className={styles.section}>
      <label className={styles.field} htmlFor="ministry-platform">Platform *<select id="ministry-platform" value={platform} onChange={event => setPlatform(event.target.value)}><option value="">Choose a platform</option>{OUTREACH_PLATFORMS.map(row => <option key={row.key} value={row.key}>{row.label}</option>)}</select></label>
      {platform === "other" ? <label className={styles.field} htmlFor="ministry-platform-other">Which platform? *<input id="ministry-platform-other" maxLength={120} value={platformOther} onChange={event => setPlatformOther(event.target.value)} /></label> : null}
      {method === "Both" ? <><label className={styles.field}>People reached online *<input inputMode="numeric" value={onlineCount} onChange={event => setOnlineCount(event.target.value)} /></label><label className={styles.field}>People reached offline *<input inputMode="numeric" value={offlineCount} onChange={event => setOfflineCount(event.target.value)} /></label><p className={styles.muted}>These two counts must add up to the total below.</p></> : null}
    </div> : null}
    <section className={styles.section} aria-labelledby="people-heading">
      <h2 id="people-heading">People</h2>
      <label className={styles.total} htmlFor="ministry-count">{kind === "outreach" ? "People reached" : "People involved"}
        <input ref={totalInput} id="ministry-count" inputMode="numeric" value={count} onChange={event => setCount(event.target.value)} aria-invalid={Boolean(countError) || undefined} aria-describedby={countError ? "ministry-count-error" : "ministry-count-hint"} />
      </label>
      {countError ? <p id="ministry-count-error" className={styles.error} role="alert">{countError}</p> : null}
      <p id="ministry-count-hint" className={styles.muted}>Named people are included in this total.<br />You can report a count without saving contacts.</p>
    </section>
    <section className={styles.section} aria-labelledby="named-heading">
      <div className={styles.sectionHeader}><h2 id="named-heading">Named people</h2><button ref={addButton} className={styles.add} type="button" disabled={contacts.length >= CONTACTS_PER_DAY_MAX || saved || saving} onClick={() => setSheet(true)}><DashboardIcon name="plus" size={16} />Add contact</button></div>
      <label className={styles.search}><span className={styles.srOnly}>Find a saved contact</span><DashboardIcon name="search" size={16} /><input type="search" placeholder="Find a saved contact" value={query} onChange={event => setQuery(event.target.value)} /></label>
      {choices.length ? <ul className={styles.people}>{choices.map(row => <li key={row.key}><span className={styles.person}><span>{row.name}</span><span className={styles.muted}>{row.phone ?? "Phone not recorded"}</span></span><button type="button" className={styles.add} disabled={contacts.length >= CONTACTS_PER_DAY_MAX} onClick={() => setContacts(current => [...current, row])}>Add<span className={styles.srOnly}> {row.name}</span></button></li>)}</ul> : null}
      {visible.length ? <ul className={styles.people}>{visible.map(contact => <li key={contact.key}>
        <span className={styles.avatar} aria-hidden="true">{contact.name.split(" ").map(word => word[0]).slice(0, 2).join("")}</span>
        <span className={styles.person}><span>{contact.name}</span><span className={styles.muted}>{contact.phone}</span></span>
        <button type="button" className={styles.remove} disabled={saving || saved} aria-label={`Remove ${contact.name} from report`} onClick={() => setContacts(current => current.filter(row => row.key !== contact.key))}><DashboardIcon name="close" size={16} /></button>
      </li>)}</ul> : <p className={styles.muted}>{query ? "No contacts match your search." : "No named people added. You can still save a count-only report."}</p>}
    </section>
    <details ref={outcomesDetails} className={styles.details}><summary><DashboardIcon name="circlecheck" /><span>Outcomes · optional</span><span className={styles.muted}>Saved, filled and healed</span><DashboardIcon name="right" size={16} /></summary>
      <p className={styles.muted}>Saved means a person believed the Gospel; filled means a person was filled with the Holy Ghost; healed means someone testified they were healed after prayer. Blank means none.</p>
      {MINISTRY_FIELDS.filter(field => !["attendance", "reachedOnline", "reachedOffline", "followUps", ...(kind === "follow_up" ? ["notSaved"] : [])].includes(field.key)).map(field => <label className={styles.field} key={field.key} htmlFor={`ministry-${field.key}`}>{field.label}<input id={`ministry-${field.key}`} inputMode="numeric" value={outcomes[field.key] ?? ""} onChange={event => setOutcomes(current => ({ ...current, [field.key]: event.target.value }))} aria-invalid={outcomeError?.field === field.key || undefined} aria-describedby={outcomeError?.field === field.key ? `ministry-${field.key}-error` : undefined} />{outcomeError?.field === field.key ? <span className={styles.error} id={`ministry-${field.key}-error`}>{outcomeError.error}</span> : null}</label>)}
    </details>
    <details className={styles.note}><summary>Add an overall note</summary><label className={styles.field} htmlFor="ministry-note">Overall note (optional)<textarea id="ministry-note" rows={4} maxLength={MINISTRY_NOTE_MAX} value={note} onChange={event => setNote(event.target.value)} /></label></details>
    {error ? <p className={styles.error} role="alert">{error}</p> : null}
    {saved ? <p role="status">Report saved.</p> : null}
    <div className={styles.footer}><button type="button" className={styles.primary} disabled={saving || saved || readOnly} onClick={save}>{readOnly ? "This day is view only" : saving ? "Saving…" : saved ? "Report saved" : "Save ministry report"}<DashboardIcon name="check" /></button></div>
    </fieldset>
    {sheet ? <ContactSheet onClose={closeSheet} onPersist={onCreateContact} onAdd={contact => { setContacts(current => [...current, contact]); setSources(current => [...current, contact]); closeSheet(); }} /> : null}
  </div>;
}
