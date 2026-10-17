"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { MessageCircleIcon } from "lucide-react";

import { leaveDiscipleshipGroupAction, setDiscipleSharesPhoneAction } from "@/app/(site)/dashboard/sogp/discipleship/_actions";
import { DisciplePromptList, useDiscipleshipAction } from "@/components/sogp/discipleship-check-ins";
import { OwnEpisodeQuestionList } from "@/components/sogp/discipleship-episode-questions";
import { DisciplePrayerSection } from "@/components/sogp/discipleship-prayer";
import type { CommunityDiscipleship } from "@/lib/db/queries/community-discipleship";
import type { FeedPost } from "@/lib/db/queries/community-posts";
import type { OwnEpisodeQuestion } from "@/lib/db/queries/sogp-episode-questions";
import type { DisciplerView } from "@/lib/db/queries/sogp-discipleship";

import { FeedComposer } from "../feed-composer";
import { GroupHero, GroupTabs } from "../groups/group-hero";
import { MessageButton } from "../messages/message-button";
import { PostFeed } from "../post-feed";
import styles from "./discipleship-group.module.css";
import { Initials, SharePhoneToggle } from "./shared";

type Tab = "checkins" | "discussion" | "prayer" | "members";

/**
 * The group a learner belongs to as a disciple: their discipler, the
 * check-ins and prayer requests between the two of them, the group's
 * discussion and its members. Answers and requests are only ever theirs.
 */
export function MemberGroupView({ joined, discipler, ownEpisodeQuestions, discussion, initialTab }: {
  joined: NonNullable<CommunityDiscipleship["joined"]>;
  discipler: DisciplerView;
  ownEpisodeQuestions: OwnEpisodeQuestion[];
  discussion: { viewerName: string; postingBlocked: boolean; initialPosts?: FeedPost[]; initialNextOffset?: number | null };
  initialTab?: string;
}) {
  const router = useRouter();
  const leave = useDiscipleshipAction(false);
  const waiting = discipler.prompts.filter(prompt => !prompt.response).length;
  const tabs: Array<{ key: Tab; label: string; count?: number }> = [
    { key: "checkins", label: "Check-ins", count: waiting || undefined },
    { key: "discussion", label: "Discussion" },
    { key: "prayer", label: "Prayer" },
    { key: "members", label: "Members", count: joined.fellowDisciples.length + 1 },
  ];
  const [tab, setTab] = useState<Tab>(tabs.find(item => item.key === initialTab)?.key ?? "checkins");
  const lead = discipler.leaderFirstName;

  return <div className={styles.page}>
    <GroupHero art="discipleship" tag="Your group" title={joined.groupName} meta={`Led by ${lead} · you joined ${joined.joinedMonth}`} />

    <div className={styles.panel}>
      <div className={styles.leader}>
        <Initials name={discipler.leaderName} />
        <span className={styles.rowCopy}><span className={styles.rowTitle} style={{ fontWeight: 500 }}>{lead}</span><span className={styles.rowMeta}>Your discipler</span></span>
        {discipler.whatsappUrl ? <a href={discipler.whatsappUrl} target="_blank" rel="noopener noreferrer" className={`${styles.btn} ${styles.mini}`}><MessageCircleIcon className="size-3.5" strokeWidth={2} />WhatsApp</a> : null}
        {joined.discipler.messageUserId ? <MessageButton userId={joined.discipler.messageUserId} /> : null}
      </div>
    </div>

    <GroupTabs tabs={tabs} value={tab} onChange={setTab} />

    {tab === "checkins" ? <>
      <div className={`${styles.panel} ${styles.tools}`}><DisciplePromptList prompts={discipler.prompts} leaderFirstName={lead} preview={false} /></div>
      {ownEpisodeQuestions.length ? <>
        <div className={styles.sectionTitle}><h2>Your questions about teachings</h2></div>
        <div className={`${styles.panel} ${styles.tools}`}><OwnEpisodeQuestionList questions={ownEpisodeQuestions} leaderFirstName={lead} preview={false} /></div>
      </> : null}
      <p className={styles.note}>🔒 Only {lead} reads your answers. Other disciples never see them.</p>
    </> : null}

    {tab === "discussion" ? <>
      <FeedComposer key={`composer-${joined.groupId}`} viewerName={discussion.viewerName} unitName={null} target={{ scope: "discipleship", id: joined.groupId }} officialReach="none" postingBlocked={discussion.postingBlocked} />
      <PostFeed key={`feed-${joined.groupId}`} source={{ type: "discipleship", id: joined.groupId }} initialPosts={discussion.initialPosts} initialNextOffset={discussion.initialNextOffset} viewerName={discussion.viewerName} viewerUnitName={null} canRepost={false} isAdmin={false} emptyText="Nothing here yet. Ask a question or share what you are learning." />
    </> : null}

    {tab === "prayer" ? <div className={`${styles.panel} ${styles.tools}`}><DisciplePrayerSection requests={discipler.prayerRequests} leaderFirstName={lead} preview={false} /></div> : null}

    {tab === "members" ? <div className={styles.panel}>
      <ul className={styles.list}>
        <li className={styles.row}>
          <Initials name={joined.discipler.firstName} />
          <span className={styles.rowCopy}><span className={styles.rowTitle}>{joined.discipler.firstName}</span><span className={styles.rowMeta}>Discipler · leads this group</span></span>
          {joined.discipler.messageUserId ? <MessageButton userId={joined.discipler.messageUserId} /> : null}
        </li>
        {joined.fellowDisciples.map((person, index) => <li key={`${person.firstName}-${index}`} className={styles.row}>
          <Initials name={person.firstName} />
          <span className={styles.rowCopy}><span className={styles.rowTitle}>{person.firstName}</span><span className={styles.rowMeta}>Joined {person.joinedMonth}</span></span>
          {person.messageUserId ? <MessageButton userId={person.messageUserId} /> : null}
        </li>)}
      </ul>
    </div> : null}

    <div className={`${styles.panel} ${styles.tools}`}>
      <SharePhoneToggle id="disciple-shares-phone" label={`Let ${lead} contact me on WhatsApp`} initial={discipler.sharesPhone} onChange={sharesPhone => setDiscipleSharesPhoneAction({ sharesPhone })} />
      <button type="button" className={styles.danger} disabled={leave.pending} onClick={() => {
        if (window.confirm(`Leave ${lead}'s group? They will no longer see your progress or answers.`)) {
          leave.run(() => leaveDiscipleshipGroupAction(), () => router.replace("/dashboard/community/groups"));
        }
      }}>Leave group</button>
      {leave.error ? <p role="alert" className={styles.error}>{leave.error}</p> : null}
    </div>
  </div>;
}
