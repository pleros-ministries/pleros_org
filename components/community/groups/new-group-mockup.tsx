"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon, LockIcon } from "lucide-react";

import { DISCIPLESHIP_GROUP_NAME_MAX } from "@/lib/sogp/discipleship";

import styles from "../discipleship/discipleship-group.module.css";
import { GroupHero, groupIcon } from "./group-hero";

/**
 * Mockup (sample data, nothing saved): "+ New group" opens its own page
 * instead of the create form under the first led group's hero.
 */
export function NewGroupMockup({ view }: { view: "now" | "proposed" }) {
  return view === "now" ? <Now /> : <Proposed />;
}

/** What happens today: the form sits under an existing group's banner. */
function Now() {
  return <div className={styles.page}>
    <Crumbs trail={["Groups", "Campus fellowship"]} />
    <GroupHero art="leading" tag="You lead" title="Campus fellowship" meta="3 members" actions={<button type="button" className={styles.btn} data-primary>Invite</button>} />
    <CreateFields onCancel={() => {}} />
  </div>;
}

/** The correction: a page of its own, with a preview of the card it makes. */
function Proposed() {
  return <div className={styles.page}>
    <Crumbs trail={["Groups", "New group"]} />
    <div>
      <h1 className="text-[21px] leading-[28px] font-medium">New group</h1>
      <p className={styles.sub}>You lead 2 groups · you can lead up to 20</p>
    </div>
    <CreateFields onCancel={() => {}} showPreview />

    <div className={styles.sectionTitle}><h2>What happens next</h2></div>
    <div className={styles.panel}>
      <ol className={styles.steps}>
        <li><b>1</b><span>Your group gets its own invite link<small>Share it on WhatsApp or anywhere else.</small></span></li>
        <li><b>2</b><span>Add people by name<small>Anyone enrolled in SOGP. They get an invitation to accept.</small></span></li>
        <li><b>3</b><span>You look after them<small>Their daily reports show in Oversight once they join.</small></span></li>
      </ol>
    </div>
    <p className={`${styles.note} flex gap-1.5`}><LockIcon className="mt-[2px] size-3 flex-none" strokeWidth={2} />Groups are invite-only. Each person is in one group, so joining yours moves them from any other.</p>
  </div>;
}

function CreateFields({ onCancel, showPreview = false }: { onCancel: () => void; showPreview?: boolean }) {
  const [name, setName] = useState("");
  const [sent, setSent] = useState(false);
  const title = name.trim() || "Your new group";
  return <form className={`${styles.panel} ${styles.form}`} onSubmit={event => { event.preventDefault(); setSent(true); }}>
    <label htmlFor="mock-new-group">{showPreview ? "Group name" : "Name your new group"}</label>
    <input id="mock-new-group" type="text" value={name} maxLength={DISCIPLESHIP_GROUP_NAME_MAX} onChange={event => { setName(event.target.value); setSent(false); }} placeholder="For example, Family or Campus fellowship" />
    {showPreview ? <>
      <p className={styles.note} style={{ margin: 0 }}>Only you and the people you invite see this name.</p>
      {/* Groups you lead alternate lilac and slate, oldest first: a third group is lilac. */}
      <div className="mt-1 flex items-center gap-3 rounded-[10px] bg-[#f6f7f9] p-2.5">
        <span aria-hidden className="size-10 flex-none rounded-[10px] bg-cover bg-center" style={groupIcon("leading")} />
        <span className={styles.rowCopy}><span className={styles.rowTitle} data-placeholder={!name.trim() || undefined} style={!name.trim() ? { color: "var(--color-community-muted)" } : undefined}>{title}</span><span className={styles.rowMeta}>You lead · no members yet</span></span>
      </div>
    </> : <p className={styles.note} style={{ margin: 0 }}>Each group has its own invite link.</p>}
    {sent ? <p role="status" className={styles.note} style={{ margin: 0 }}>Preview: in the app this opens {title} with its invite link ready.</p> : null}
    <div className={styles.formActions}>
      <button type="button" className={styles.btn} onClick={onCancel}>Cancel</button>
      <button type="submit" className={styles.btn} data-primary disabled={!name.trim()}>Create group</button>
    </div>
  </form>;
}

/** Stand-in for the shell's breadcrumb bar, which previews don't render. */
function Crumbs({ trail }: { trail: string[] }) {
  return <nav aria-label="Breadcrumb" className="-mx-4 -mt-[18px] mb-1 flex h-10 items-center gap-1.5 border-b border-[var(--dashboard-panel-edge,#e2e5ea)] bg-white px-4 text-[12.5px] text-(--color-community-muted)">
    <Link href="#" aria-label="Back" className="-ml-1 grid size-7 place-items-center"><ChevronLeftIcon className="size-4" strokeWidth={2} /></Link>
    {trail.map((crumb, index) => <span key={crumb} className="flex items-center gap-1.5">
      {index ? <ChevronRightIcon className="size-3" strokeWidth={2} /> : null}
      <span className={index === trail.length - 1 ? "font-medium text-(--color-community-ink)" : undefined}>{crumb}</span>
    </span>)}
  </nav>;
}
