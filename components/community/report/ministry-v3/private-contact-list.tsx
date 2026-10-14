"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import { ContactSheet } from "./ministry-form";
import type { MinistryContact } from "@/lib/community/reporting-v3";
import { createPrivateContactAction } from "@/app/(site)/dashboard/community/_actions/reporting-v3-actions";
import styles from "./ministry-form.module.css";

export function PrivateContactList({ initial, readOnly = false }: { initial: MinistryContact[]; readOnly?: boolean }) {
  const [rows, setRows] = useState(initial), [query, setQuery] = useState(""), [open, setOpen] = useState(false);
  const button = useRef<HTMLButtonElement>(null);
  function close() { setOpen(false); requestAnimationFrame(() => button.current?.focus()); }
  const results = rows.filter(row => `${row.name} ${row.phone ?? ""} ${row.email ?? ""}`.toLowerCase().includes(query.trim().toLowerCase()));
  return <section className={styles.form}>
    <div className={styles.sectionHeader}><h2>Private saved contacts</h2><button ref={button} disabled={readOnly} className={styles.add} onClick={() => setOpen(true)}>Add contact</button></div>
    <p className={styles.muted}>Only you can see these contacts. Saving does not create an account, invitation or group membership.</p>
    <label className={styles.field}>Search private contacts<input type="search" value={query} onChange={event => setQuery(event.target.value)} /></label>
    {results.length ? <ul className={styles.people}>{results.map(row => <li key={row.key}><Link className={`${styles.person} py-3`} href={`/dashboard/community/report/people/private/${row.key.split(":")[1]}`}><span>{row.name}</span><span className={styles.muted}>{row.phone}</span></Link></li>)}</ul> : <p className={styles.muted}>{query ? "No contacts match your search." : "No private contacts saved yet."}</p>}
    {open ? <ContactSheet standalone onPersist={createPrivateContactAction} onClose={close} onAdd={row => { setRows(current => [...current, row]); close(); }} /> : null}
  </section>;
}
