"use client";
import { useRef, useState } from "react";
import type { MinistryContact } from "@/lib/community/reporting-v3";
import { CONTACTS_PER_DAY_MAX } from "@/lib/community/outreach-contacts";
import { ContactSheet, type PersistContact } from "./ministry-form";
import styles from "./ministry-form.module.css";

export function ReportContactPicker({ available, selected, onChange, onCreate, disabled }: {
  available: MinistryContact[]; selected: MinistryContact[]; onChange: (rows: MinistryContact[]) => void; onCreate?: PersistContact; disabled?: boolean;
}) {
  const [query, setQuery] = useState(""), [open, setOpen] = useState(false), [created, setCreated] = useState<MinistryContact[]>([]);
  const button = useRef<HTMLButtonElement>(null), selectedKeys = new Set(selected.map(row => row.key));
  const choices = [...available, ...created].filter(row => !selectedKeys.has(row.key) && `${row.name} ${row.phone ?? ""}`.toLowerCase().includes(query.trim().toLowerCase())).slice(0, 20);
  function close() { setOpen(false); requestAnimationFrame(() => button.current?.focus()); }
  return <div className={styles.section}>
    <div className={styles.sectionHeader}><h2>People I brought</h2><button ref={button} type="button" className={styles.add} disabled={disabled || selected.length >= CONTACTS_PER_DAY_MAX} onClick={() => setOpen(true)}>Add contact</button></div>
    <label className={styles.field}>Search saved contacts<input disabled={disabled} type="search" value={query} onChange={event => setQuery(event.target.value)} /></label>
    {choices.length ? <ul className={styles.people}>{choices.map(row => <li key={row.key}><span className={styles.person}>{row.name}</span><button type="button" disabled={disabled || selected.length >= CONTACTS_PER_DAY_MAX} className={styles.add} onClick={() => onChange([...selected, row])}>Add<span className={styles.srOnly}> {row.name}</span></button></li>)}</ul> : null}
    <ul className={styles.people}>{selected.map(row => <li key={row.key}><span className={styles.person}>{row.name}<span className={styles.muted}>{row.phone ?? "Phone not recorded"}</span></span><button type="button" disabled={disabled} className={styles.remove} aria-label={`Remove ${row.name} from this report`} onClick={() => onChange(selected.filter(other => other.key !== row.key))}>×</button></li>)}</ul>
    <p className={styles.muted}>{selected.length ? `${selected.length} named ${selected.length === 1 ? "person" : "people"} brought. Adding a contact does not invite them.` : "No people selected. You can report your own attendance without bringing anyone."}</p>
    {open ? <ContactSheet onClose={close} onPersist={onCreate} onAdd={row => { setCreated(current => [...current, row]); onChange([...selected, row]); close(); }} /> : null}
  </div>;
}
