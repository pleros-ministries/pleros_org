"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CalendarCheckIcon, ChevronRightIcon, LinkIcon, PencilIcon, PlusIcon, UserPlusIcon, XCircleIcon } from "lucide-react";

import {
  closeDiscipleshipGroupAction,
  createDiscipleshipGroupAction,
  regenerateInviteLinkAction,
  renameDiscipleshipGroupAction,
} from "@/app/(site)/dashboard/sogp/discipleship/_actions";
import { LeaderPromptList, PromptComposer, useDiscipleshipAction } from "@/components/sogp/discipleship-check-ins";
import { LeaderEpisodeQuestionList } from "@/components/sogp/discipleship-episode-questions";
import { LeaderPrayerList } from "@/components/sogp/discipleship-prayer";
import type { FeedPost } from "@/lib/db/queries/community-posts";
import type { LeaderEpisodeQuestion } from "@/lib/db/queries/sogp-episode-questions";
import type { DiscipleSummary, DiscipleshipDashboardData } from "@/lib/db/queries/sogp-discipleship";
import { DISCIPLESHIP_GROUP_NAME_MAX, evaluateCloseDiscipleshipGroup } from "@/lib/sogp/discipleship";

import { CrumbLabel } from "@/components/dashboard/shell/breadcrumbs";

import { ActionMenu, type MenuAction } from "../action-menu";
import { FeedComposer } from "../feed-composer";
import { GroupHero, GroupTabs } from "../groups/group-hero";
import { PostFeed } from "../post-feed";
import styles from "./discipleship-group.module.css";
import { Initials, InvitePanel, Meter, StatusPill, StatusStrip, byNeed, statusOf } from "./shared";

export type LeaderTab = "disciples" | "discussion" | "checkins" | "prayer";

export const groupPath = (groupId: number) => `/dashboard/community/discipleship/${groupId}`;

function discipleMeta(disciple: DiscipleSummary) {
  if (statusOf(disciple.status)?.tone === "off") {
    return disciple.lastActiveAt ? `Last active ${new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "Africa/Lagos" }).format(new Date(disciple.lastActiveAt))}` : "No activity yet";
  }
  const parts = [
    disciple.averageQuizScore !== null ? `quiz avg ${disciple.averageQuizScore}%` : null,
    disciple.prayerPercent !== null ? `Prayer Watch ${disciple.prayerPercent}%` : null,
    disciple.openPrayerCount > 0 ? `${disciple.openPrayerCount} prayer request${disciple.openPrayerCount === 1 ? "" : "s"}` : null,
  ].filter(Boolean);
  return parts.length ? parts.join(" · ") : "Just getting started";
}

/**
 * A discipleship group the viewer leads: its disciples (by who needs them
 * first), discussion, check-ins and prayer requests, with the invite and
 * group settings in the hero. Each disciple opens their own page.
 */
export function LeaderGroupView({ data, episodeQuestions, colourway, initialTab, initialPanel = null, addByName = true, discussion }: {
  data: DiscipleshipDashboardData;
  episodeQuestions: LeaderEpisodeQuestion[];
  colourway?: "slate";
  initialTab: LeaderTab;
  /** Opens a panel on arrival, e.g. "+ New group" on Community Home. */
  initialPanel?: "invite" | "create" | null;
  /** Groups as oversight: leaders also add people by name. */
  addByName?: boolean;
  discussion: { viewerName: string; postingBlocked: boolean; initialPosts?: FeedPost[]; initialNextOffset?: number | null };
}) {
  const router = useRouter();
  const group = data.selectedGroup;
  const paused = group.status === "archived";
  const disciples = [...group.disciples].sort(byNeed);
  const hasDisciples = disciples.length > 0;
  // An empty group already shows the invite panel in place, so don't open a second one.
  const [panel, setPanel] = useState<"invite" | "rename" | "create" | null>(initialPanel === "invite" && !hasDisciples ? null : initialPanel);
  const tabs: Array<{ key: LeaderTab; label: string; count?: number }> = [
    { key: "disciples", label: "Members", count: disciples.length },
    ...(hasDisciples && !paused ? [
      { key: "discussion" as const, label: "Discussion" },
      { key: "checkins" as const, label: "Check-ins", count: group.prompts.reduce((n, prompt) => n + prompt.responses.filter(response => !response.leaderReply).length, 0) || undefined },
      { key: "prayer" as const, label: "Prayer", count: group.prayerRequests.filter(request => request.status === "open" && !request.prayedAt).length || undefined },
    ] : []),
  ];
  const [tab, setTab] = useState<LeaderTab>(tabs.some(item => item.key === initialTab) ? initialTab : "disciples");
  const close = useDiscipleshipAction(false);
  const regenerate = useDiscipleshipAction(false);
  const canClose = evaluateCloseDiscipleshipGroup({ status: group.status, openGroupCount: data.ledGroups.length }).ok;

  const menu: MenuAction[] = paused ? [] : [
    { key: "rename", label: "Rename group", icon: PencilIcon, onSelect: () => setPanel("rename") },
    ...(hasDisciples ? [{ key: "contact", label: "Add a contact", icon: UserPlusIcon, onSelect: () => router.push(`/dashboard/community/contacts/new?invite=${group.id}`) }] : []),
    { key: "link", label: "New invite link", icon: LinkIcon, onSelect: () => {
      if (window.confirm("Create a new invite link for this group? Its old link will stop working.")) regenerate.run(() => regenerateInviteLinkAction({ groupId: group.id }));
    } },
    { key: "reviews", label: "Weekly group reviews", icon: CalendarCheckIcon, onSelect: () => router.push(`/dashboard/sogp/reviews?group=${group.id}`) },
    ...(data.createGroupBlock ? [] : [{ key: "create", label: "New group", icon: PlusIcon, onSelect: () => setPanel("create") }]),
    ...(canClose ? [{ key: "close", label: "Close group", icon: XCircleIcon, danger: true, onSelect: () => {
      // Closing ends oversight for everyone in it; whoever they lead stays with them.
      const released = hasDisciples ? `. Its ${disciples.length === 1 ? "1 person" : `${disciples.length} people`} will leave the group and no longer have you looking after them; the people they lead stay with them` : "";
      if (window.confirm(`Close ${group.name}? Its invite link will stop working${released}. This can't be undone.`)) {
        close.run(() => closeDiscipleshipGroupAction({ groupId: group.id }), () => router.replace("/dashboard/community/groups"));
      }
    } }] : []),
  ];

  return <div className={styles.page}>
    <CrumbLabel href={groupPath(group.id)} label={group.name} />
    <GroupHero
      art="leading"
      colourway={colourway}
      tag={paused ? "Paused" : "You lead"}
      title={group.name}
      meta={hasDisciples ? `${disciples.length} ${disciples.length === 1 ? "member" : "members"}` : "No members yet"}
      // The ··· menu always sits beside a primary action: Invite once people have
      // joined, otherwise Add a contact (the invite link fills the page below).
      actions={paused ? null : <>
        {hasDisciples ? <>
          <button type="button" className={styles.btn} data-primary onClick={() => setPanel(panel === "invite" ? null : "invite")} aria-expanded={panel === "invite"}>Invite</button>
          <button type="button" className={styles.btn} onClick={() => setTab("checkins")}>Ask a check-in</button>
        </> : <Link href={`/dashboard/community/contacts/new?invite=${group.id}`} className={styles.btn} data-primary><UserPlusIcon className="size-3.5" strokeWidth={2} />Add a contact</Link>}
        <ActionMenu label="Group options" actions={menu} className="!size-8 !rounded-[10px] border border-[var(--dashboard-panel-edge,#e2e5ea)] bg-white" />
      </>}
    />
    {close.error || regenerate.error ? <p role="alert" className={styles.error}>{close.error ?? regenerate.error}</p> : null}

    {paused ? <p className={`${styles.panel} ${styles.empty}`}>This group has been paused by the Pleros team. Contact support if you think this is a mistake.</p> : null}
    {panel === "invite" ? <InvitePanel group={group} leaderFirstName={data.viewer.firstName} empty={false} addByName={addByName} /> : null}
    {panel === "rename" ? <RenameForm group={group} onDone={() => setPanel(null)} /> : null}
    {panel === "create" ? <CreateForm onCancel={() => setPanel(null)} onCreated={id => router.push(groupPath(id))} /> : null}

    {tabs.length > 1 ? <GroupTabs tabs={tabs} value={tab} onChange={setTab} /> : null}

    {tab === "disciples" ? (hasDisciples ? <>
      <StatusStrip disciples={disciples} />
      <div className={styles.panel}>
        <ul className={styles.list}>
          {disciples.map(disciple => <li key={disciple.membershipId}>
            <Link href={`${groupPath(group.id)}/disciples/${disciple.membershipId}`} prefetch={false} className={styles.row}>
              <Initials name={disciple.name} status={disciple.status} />
              <span className={styles.rowCopy}><span className={styles.rowTitle}>{disciple.firstName}</span><span className={styles.rowMeta}>{discipleMeta(disciple)}</span></span>
              <span className={styles.rowEnd}><StatusPill status={disciple.status} /><Meter value={disciple.coreCompleted} max={disciple.coreTotal} /></span>
              <ChevronRightIcon className={`${styles.chev} size-4`} strokeWidth={2} />
            </Link>
          </li>)}
        </ul>
      </div>
      <p className={styles.note}>Sorted by who needs you first. Tap someone for their week, check-ins, prayer and your follow-ups.</p>
    </> : paused ? null : <>
      <div className={styles.sectionTitle}><h2>Invite someone</h2></div>
      <InvitePanel group={group} leaderFirstName={data.viewer.firstName} empty addByName={addByName} />
    </>) : null}

    {tab === "discussion" ? <>
      <FeedComposer key={`composer-${group.id}`} viewerName={discussion.viewerName} unitName={null} target={{ scope: "discipleship", id: group.id }} officialReach="all" postingBlocked={discussion.postingBlocked} />
      <PostFeed key={`feed-${group.id}`} source={{ type: "discipleship", id: group.id }} initialPosts={discussion.initialPosts} initialNextOffset={discussion.initialNextOffset} viewerName={discussion.viewerName} viewerUnitName={null} canRepost={false} isAdmin={false} emptyText="Nothing here yet. Ask a question or share what you are learning." />
    </> : null}

    {tab === "checkins" ? <>
      <div className={`${styles.panel} ${styles.tools}`}>
        <PromptComposer groupId={group.id} preview={false} hasDisciples={hasDisciples} suggestions={group.promptSuggestions.suggestions} levelTitle={group.promptSuggestions.levelTitle} />
      </div>
      <div className={`${styles.panel} ${styles.tools}`}>
        <LeaderPromptList prompts={group.prompts} discipleCount={disciples.length} preview={false} />
      </div>
      {episodeQuestions.length ? <>
        <div className={styles.sectionTitle}><h2>Questions about teachings</h2></div>
        <div className={`${styles.panel} ${styles.tools}`}><LeaderEpisodeQuestionList questions={episodeQuestions} preview={false} /></div>
      </> : null}
    </> : null}

    {tab === "prayer" ? <div className={`${styles.panel} ${styles.tools}`}>
      <LeaderPrayerList requests={group.prayerRequests} preview={false} />
    </div> : null}
  </div>;
}

function RenameForm({ group, onDone }: { group: { id: number; name: string }; onDone: () => void }) {
  const [name, setName] = useState(group.name);
  const { pending, error, run } = useDiscipleshipAction(false);
  return <form className={`${styles.panel} ${styles.form}`} onSubmit={event => {
    event.preventDefault();
    run(() => renameDiscipleshipGroupAction({ groupId: group.id, name }), onDone);
  }}>
    <label htmlFor={`rename-group-${group.id}`}>Group name</label>
    <input id={`rename-group-${group.id}`} type="text" value={name} maxLength={DISCIPLESHIP_GROUP_NAME_MAX} onChange={event => setName(event.target.value)} />
    {error ? <p role="alert" className={styles.error}>{error}</p> : null}
    <div className={styles.formActions}>
      <button type="button" className={styles.btn} onClick={onDone}>Cancel</button>
      <button type="submit" className={styles.btn} data-primary disabled={pending || !name.trim()}>Save name</button>
    </div>
  </form>;
}

function CreateForm({ onCancel, onCreated }: { onCancel: () => void; onCreated: (groupId: number) => void }) {
  const [name, setName] = useState("");
  const { pending, error, run } = useDiscipleshipAction(false);
  return <form className={`${styles.panel} ${styles.form}`} onSubmit={event => {
    event.preventDefault();
    let createdId: number | undefined;
    run(async () => {
      const result = await createDiscipleshipGroupAction({ name });
      if (result.ok) createdId = result.groupId;
      return result;
    }, () => { if (createdId) onCreated(createdId); });
  }}>
    <label htmlFor="new-discipleship-group">Name your new group</label>
    <input id="new-discipleship-group" type="text" value={name} maxLength={DISCIPLESHIP_GROUP_NAME_MAX} onChange={event => setName(event.target.value)} placeholder="For example, Family or Campus fellowship" />
    <p className={styles.note} style={{ margin: 0 }}>Each group has its own invite link.</p>
    {error ? <p role="alert" className={styles.error}>{error}</p> : null}
    <div className={styles.formActions}>
      <button type="button" className={styles.btn} onClick={onCancel}>Cancel</button>
      <button type="submit" className={styles.btn} data-primary disabled={pending || !name.trim()}>Create group</button>
    </div>
  </form>;
}
