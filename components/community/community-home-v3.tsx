import Link from "next/link";
import { DashboardIcon } from "@/components/dashboard/v3/primitives";
import type { CommunityHomeData } from "@/lib/db/queries/community-home";
import styles from "./community-home-v3.module.css";

type IconName = Parameters<typeof DashboardIcon>[0]["name"];
type GroupArt = "location" | "discipleship" | "leading" | "public" | "private";

/* Background art lives in public/assets/dashboard/community-groups/: a 3:2 cut
   for wider tiles and a compact square cut for phones, each at 1x and 2x. */
const groupTag: Record<GroupArt, string> = { location: "Location", discipleship: "Discipleship", leading: "You lead", public: "Public", private: "Private" };

function CountCard({ href, count, label, description, icon, tone, capped }: { href: string | null; count: number; label: string; description: string; icon: IconName; tone: "blue" | "amber" | "green"; capped?: boolean }) {
  // One column of the divided strip: a quiet icon + label, the number beneath.
  const body = <>
    <span className={styles.countHead}><DashboardIcon name={icon} size={16} strokeWidth={1.8} /><span>{label}</span></span>
    <b>{count}{capped ? "+" : ""}</b>
  </>;
  return href && count > 0
    ? <Link href={href} prefetch={false} className={styles.count} data-tone={tone} data-active aria-label={`${count}${capped ? " or more" : ""} ${description}`}>{body}</Link>
    : <div className={styles.count} data-tone={tone} aria-label={`${count} ${description}`}>{body}</div>;
}

function GroupCard({ href, art, title, meta, prefetch }: { href: string; art: GroupArt; title: string; meta: string; prefetch?: false }) {
  return <Link href={href} prefetch={prefetch} className={styles.groupCard} data-art={art} title={title}>
    <span className={styles.groupTop}><span className={styles.groupTag}>{groupTag[art]}</span><h3>{title}</h3></span>
    <span className={styles.groupMeta}>{meta}</span>
  </Link>;
}

function OversightRow({ href, title, description, icon, tone, prefetch }: { href: string; title: string; description: string; icon: IconName; tone: string; prefetch?: false }) {
  return <Link href={href} prefetch={prefetch} className={styles.oversightRow}>
    <span className={styles.oversightIcon} data-tone={tone}><DashboardIcon name={icon} size={16} strokeWidth={2} /></span>
    <span className={styles.copy}><span className={styles.oversightTitle}>{title}</span><span className={styles.meta}>{description}</span></span>
    <DashboardIcon name="right" size={16} />
  </Link>;
}

const people = (n: number) => `${n} ${n === 1 ? "person" : "people"}`;

export function CommunityHomeV3({ data }: { data: CommunityHomeData }) {
  const firstInvitation = data.invitations[0];
  const firstResponse = data.responses[0];
  return <div className={styles.home} data-community-home-v3>
    <header className={styles.heading}>
      <h1>Your Pleros Community</h1>
    </header>

    <div className={styles.counts} aria-label="Waiting for you">
      <CountCard href="/dashboard/community/messages" count={data.unreadConversations} label="Messages" description={data.unreadConversations === 1 ? "unread message" : "unread messages"} icon="chat" tone="blue" />
      <CountCard href={firstResponse ? (data.responses.length > 1 ? "/dashboard/sogp/discipleship#check-ins" : firstResponse.href) : null} count={data.responses.length} capped={data.responses.length >= 3} label="Check-ins" description={data.responses.length === 1 ? "check-in to answer" : "check-ins to answer"} icon="clipboardcheck" tone="amber" />
      <CountCard href={firstInvitation ? `/dashboard/sogp/invitations/${firstInvitation.id}` : null} count={data.invitations.length} label="Invitations" description={data.invitations.length === 1 ? "group invitation" : "group invitations"} icon="mail" tone="green" />
    </div>

    <section className={styles.block} aria-labelledby="community-groups">
      <div className={styles.blockHeading}><h2 id="community-groups">Your groups</h2><Link href="/dashboard/community/groups">See all</Link></div>
      <div className={styles.groupGrid}>
        {data.locationGroup ? <GroupCard href={`/dashboard/community/unit/${data.locationGroup.id}`} art="location" title={data.locationGroup.name} meta="Your location group" /> : null}
        {data.joinedGroup ? <GroupCard href={`/dashboard/community/discipleship?group=${data.joinedGroup.groupId}`} art="discipleship" title={data.joinedGroup.groupName} meta="You're a member" /> : null}
        {data.ledGroups.map(group => <GroupCard key={`led-${group.groupId}`} href={group.discipleCount ? `/dashboard/community/discipleship?group=${group.groupId}` : `/dashboard/sogp/discipleship?group=${group.groupId}`} prefetch={false} art="leading" title={group.groupName} meta={group.discipleCount ? `${group.discipleCount} ${group.discipleCount === 1 ? "disciple" : "disciples"}` : "Invite your first disciple"} />)}
        {data.memberGroups.map(group => <GroupCard key={`member-${group.id}`} href={`/dashboard/community/groups/${group.id}`} art={group.privacy === "private" ? "private" : "public"} title={group.name} meta={group.viewerRole === "owner" ? "You own this group" : group.viewerRole === "moderator" ? "You moderate" : "Member"} />)}
        <Link href="/dashboard/community/groups?create=1" className={styles.newGroup}>
          <span className={styles.newGroupIcon}><DashboardIcon name="plus" size={16} /></span>
          New group
        </Link>
      </div>
    </section>

    {data.disciplesEnabled || data.church ? <section className={styles.block} aria-labelledby="community-oversight">
      <div className={styles.blockHeading}><h2 id="community-oversight">Oversight</h2></div>
      <div className={styles.oversightPanel}>
        {data.disciplesEnabled ? <OversightRow href="/dashboard/sogp/discipleship" prefetch={false} title="My disciples" description={`${people(data.discipleCount)} · you lead`} icon="leaf" tone="green" /> : null}
        {data.disciplesEnabled ? <OversightRow href="/dashboard/sogp/enrollees" title="My enrollees" description={data.enrolleeCount ? `${people(data.enrolleeCount)} · you follow up` : "People you follow up"} icon="people" tone="blue" /> : null}
        {data.church ? <OversightRow href={data.church.href} title="Church oversight" description="Your branch and workers" icon="network" tone="lilac" /> : null}
      </div>
    </section> : null}
  </div>;
}
