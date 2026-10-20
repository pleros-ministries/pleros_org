"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LockIcon } from "lucide-react";

import { createDiscipleshipGroupAction } from "@/app/(site)/dashboard/sogp/discipleship/_actions";
import { useDiscipleshipAction } from "@/components/sogp/discipleship-check-ins";
import { DISCIPLESHIP_GROUPS_LED_MAX, DISCIPLESHIP_GROUP_NAME_MAX } from "@/lib/sogp/discipleship";

import styles from "../discipleship/discipleship-group.module.css";
import { groupPath } from "../discipleship/leader-group";
import { groupIcon } from "./group-hero";

/**
 * "+ New group": its own page, never a form under an existing group's
 * banner. Creating opens the new group, whose empty state is its invite.
 */
export function NewGroupPage({ ledCount, colourway, block, preview = false }: {
  /** Groups the viewer leads now (not closed). */
  ledCount: number;
  /** Groups you lead alternate lilac and slate, oldest first. */
  colourway: "lilac" | "slate";
  /** Why the viewer can't create one (a paused group, or the limit). */
  block: string | null;
  preview?: boolean;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [created, setCreated] = useState(false);
  const { pending, error, run } = useDiscipleshipAction(preview);
  const typed = name.trim();

  return <div className={styles.page}>
    <div>
      <h1>New group</h1>
      <p className={styles.sub}>You lead {ledCount} {ledCount === 1 ? "group" : "groups"} · you can lead up to {DISCIPLESHIP_GROUPS_LED_MAX}</p>
    </div>

    {block ? <p className={`${styles.panel} ${styles.empty}`}>{block}</p> : <form className={`${styles.panel} ${styles.form}`} onSubmit={event => {
      event.preventDefault();
      let createdId: number | undefined;
      run(async () => {
        const result = await createDiscipleshipGroupAction({ name });
        if (result.ok) createdId = result.groupId;
        return result;
      }, () => {
        if (preview) setCreated(true);
        else if (createdId) router.push(groupPath(createdId));
      });
    }}>
      <label htmlFor="new-group-name">Group name</label>
      <input id="new-group-name" type="text" value={name} maxLength={DISCIPLESHIP_GROUP_NAME_MAX} autoComplete="off" onChange={event => { setName(event.target.value); setCreated(false); }} placeholder="For example, Family or Campus fellowship" />
      <p className={styles.note} style={{ margin: 0 }}>Only you and the people you invite see this name.</p>
      <div className="mt-1 flex items-center gap-3 rounded-[10px] bg-[#f6f7f9] p-2.5" aria-hidden>
        <span className="size-10 flex-none rounded-[10px] bg-cover bg-center" style={groupIcon(colourway === "slate" ? "leading-slate" : "leading")} />
        <span className={styles.rowCopy}>
          <span className={styles.rowTitle} style={typed ? undefined : { color: "var(--color-community-muted)" }}>{typed || "Your new group"}</span>
          <span className={styles.rowMeta}>You lead · no members yet</span>
        </span>
      </div>
      {error ? <p role="alert" className={styles.error}>{error}</p> : null}
      {created ? <p role="status" className={styles.note} style={{ margin: 0 }}>Preview: in the app this opens {typed} with its invite link ready.</p> : null}
      <div className={styles.formActions}>
        <button type="button" className={styles.btn} onClick={() => router.back()}>Cancel</button>
        <button type="submit" className={styles.btn} data-primary disabled={pending || !typed}>{pending ? "Creating…" : "Create group"}</button>
      </div>
    </form>}

    <div className={styles.sectionTitle}><h2>What happens next</h2></div>
    <div className={styles.panel}>
      <ol className={styles.steps}>
        <li><b>1</b><span>Your group gets its own invite link<small>Share it on WhatsApp or anywhere else.</small></span></li>
        <li><b>2</b><span>Add people by name<small>Anyone enrolled in SOGP. They get an invitation to accept.</small></span></li>
        <li><b>3</b><span>You look after them<small>Their daily reports show in Oversight once they join.</small></span></li>
      </ol>
    </div>
    <p className={`${styles.note} flex gap-1.5`}><LockIcon className="mt-[2px] size-3 flex-none" strokeWidth={2} aria-hidden />Groups are invite-only. Each person is in one group, so joining yours moves them from any other.</p>
  </div>;
}
