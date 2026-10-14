"use client";
import { useRef, useState } from "react";
import type { MinistryContact } from "@/lib/community/reporting-v3";
import { CONTACTS_PER_DAY_MAX } from "@/lib/community/outreach-contacts";
import { DashboardIcon } from "@/components/dashboard/v3/primitives";
import { ContactSheet, type PersistContact } from "./ministry-form";
import styles from "./ministry-form.module.css";

const initials = (name: string) => name.trim().split(/\s+/).slice(0, 2).map(part => part[0]?.toUpperCase() ?? "").join("");

/** Paper: "People I brought" in the meeting reports. Contacts stay private; nobody is invited. */
export function ReportContactPicker({ available, selected, onChange, onCreate, disabled }: {
  available: MinistryContact[]; selected: MinistryContact[]; onChange: (rows: MinistryContact[]) => void; onCreate?: PersistContact; disabled?: boolean;
}) {
  const [query, setQuery] = useState(""), [open, setOpen] = useState(false), [created, setCreated] = useState<MinistryContact[]>([]);
  const button = useRef<HTMLButtonElement>(null), selectedKeys = new Set(selected.map(row => row.key));
  const full = selected.length >= CONTACTS_PER_DAY_MAX;
  const choices = query.trim() ? [...available, ...created].filter(row => !selectedKeys.has(row.key) && `${row.name} ${row.phone ?? ""}`.toLowerCase().includes(query.trim().toLowerCase())).slice(0, 20) : [];
  function close() { setOpen(false); requestAnimationFrame(() => button.current?.focus()); }
  return <div className={styles.section}>
    <h2>People I brought</h2>
    <div className={styles.pickerRow}>
      <label className={styles.search}><span className={styles.srOnly}>Search contacts</span><DashboardIcon name="search" size={16} /><input disabled={disabled} type="search" placeholder="Search contacts" value={query} onChange={event => setQuery(event.target.value)} /></label>
      <button ref={button} type="button" className={styles.outlineAdd} disabled={disabled || full} onClick={() => setOpen(true)}><DashboardIcon name="plus" size={16} />Add contact</button>
    </div>
    {choices.length ? <ul className={styles.people}>{choices.map(row => <li key={row.key}><span className={styles.person}><span>{row.name}</span></span><button type="button" disabled={disabled || full} className={styles.add} onClick={() => { onChange([...selected, row]); setQuery(""); }}>Add<span className={styles.srOnly}> {row.name}</span></button></li>)}</ul> : query.trim() ? <p className={styles.muted}>No saved contacts match.</p> : null}
    {selected.length ? <ul className={styles.chosen}>{selected.map(row => <li key={row.key}>
      <span className={styles.avatar} aria-hidden="true">{initials(row.name)}</span>
      <span className={styles.chosenName}><span>{row.name}</span><span className={styles.muted}>Saved contact</span></span>
      <button type="button" disabled={disabled} className={styles.remove} aria-label={`Remove ${row.name} from this report`} onClick={() => onChange(selected.filter(other => other.key !== row.key))}><DashboardIcon name="close" size={16} /></button>
    </li>)}</ul> : null}
    <p className={styles.muted}>{selected.length ? "Adding a contact does not invite them." : "No one added. You can report your own attendance without bringing anyone."}</p>
    {open ? <ContactSheet onClose={close} onPersist={onCreate} onAdd={row => { setCreated(current => [...current, row]); onChange([...selected, row]); close(); }} /> : null}
  </div>;
}
