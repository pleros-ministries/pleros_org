import Link from "next/link";
import { DashboardIcon } from "@/components/dashboard/v3/primitives";
import type { CommunityHomeData } from "@/lib/db/queries/community-home";
import styles from "./community-home-v3.module.css";
import discipleStyles from "./discipleship/discipleship-group.module.css";
import { Initials } from "./discipleship/shared";
import { PeopleToBringInPanel, type PeopleToBringIn } from "./people/people-to-bring-in";

type IconName = Parameters<typeof DashboardIcon>[0]["name"];
export type GroupArt = "location" | "discipleship" | "leading" | "public" | "private";

/* Background art lives in public/assets/dashboard/community-groups/: a 3:2 cut
   for wider tiles and a compact square cut for phones, each at 1x and 2x. */
const groupTag: Record<GroupArt, string> = { location: "Location", discipleship: "Discipleship", leading: "You lead", public: "Public", private: "Private" };

function CountCard({ href, count, label, description, icon, tone, capped }: { href: string | null; count: number; label: string; description: string; icon: IconName; tone: "blue" | "amber" | "green"; capped?: boolean }) {
  // One column of the divided strip: a quiet icon + label, the number beneath.
  const body = <>
    <span className={styles.countHead}><DashboardIcon name={icon} size={16} strokeWidth={1.9} /><span>{label}</span></span>
    <b>{count}{capped ? "+" : ""}</b>
  </>;
  return href && count > 0
    ? <Link href={href} prefetch={false} className={styles.count} data-tone={tone} data-active aria-label={`${count}${capped ? " or more" : ""} ${description}`}>{body}</Link>
    : <div className={styles.count} data-tone={tone} aria-label={`${count} ${description}`}>{body}</div>;
}

/** Groups you lead share one illustration in two colourways, alternated oldest-first so neighbours differ. No light green (user preference). */
export const leadColourways = ["lilac", "slate"] as const;

export function GroupCard({ href, art, title, meta, prefetch, colourway, tag }: { href: string; art: GroupArt; title: string; meta: string; prefetch?: false; colourway?: string; tag?: string }) {
  return <Link href={href} prefetch={prefetch} className={styles.groupCard} data-art={art} data-colourway={colourway} title={title}>
    <span className={styles.groupTop}><span className={styles.groupTag}>{tag ?? groupTag[art]}</span><h3>{title}</h3></span>
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


export function CommunityHomeV3({ data, people = null }: { data: CommunityHomeData; people?: PeopleToBringIn | null }) {
  const firstInvitation = data.invitations[0];
  const firstResponse = data.responses[0];
  return <div className={styles.home} data-community-home-v3>
    <header className={styles.heading}>
      <h1>Your Pleros Community</h1>
    </header>

    <div className={styles.counts} aria-label="Waiting for you">
      <CountCard href="/dashboard/community/messages" count={data.unreadConversations} label="Messages" description={data.unreadConversations === 1 ? "unread message" : "unread messages"} icon="chat" tone="blue" />
      <CountCard href={firstResponse ? (data.responses.length > 1 ? "/dashboard/community/discipleship" : firstResponse.href) : null} count={data.responses.length} capped={data.responses.length >= 3} label="Check-ins" description={data.responses.length === 1 ? "check-in to answer" : "check-ins to answer"} icon="clipboardcheck" tone="amber" />
      <CountCard href={firstInvitation ? `/dashboard/sogp/invitations/${firstInvitation.id}` : null} count={data.invitations.length} label="Invitations" description={data.invitations.length === 1 ? "group invitation" : "group invitations"} icon="mail" tone="green" />
    </div>

    {data.needsYou.length ? <section className={styles.block} aria-labelledby="community-needs-you">
      <div className={styles.blockHeading}><h2 id="community-needs-you">Needs you</h2></div>
      <div className={discipleStyles.panel}>
        <ul className={discipleStyles.list}>
          {data.needsYou.slice(0, 5).map(item => <li key={item.key}>
            <Link href={item.href} prefetch={false} className={discipleStyles.row}>
              <Initials name={item.name} status={item.tone === "off" ? "unresponsive" : item.tone === "risk" ? "at_risk" : undefined} />
              <span className={discipleStyles.rowCopy}>
                <span className={discipleStyles.rowTitle} style={{ fontWeight: 500 }}>{item.firstName}</span>
                <span className={discipleStyles.rowMeta}>{item.detail}{data.showGroupNames && item.groupName ? ` · ${item.groupName}` : ""}</span>
              </span>
              <span className={`${discipleStyles.btn} ${discipleStyles.mini}`} data-primary={item.tone === "off" ? "" : undefined}>{item.action}</span>
            </Link>
          </li>)}
        </ul>
      </div>
    </section> : null}

    <section className={styles.block} aria-labelledby="community-groups">
      <div className={styles.blockHeading}><h2 id="community-groups">Your groups</h2><Link href="/dashboard/community/groups">See all</Link></div>
      <div className={styles.groupGrid}>
        {data.locationGroup ? <GroupCard href={`/dashboard/community/unit/${data.locationGroup.id}`} art="location" title={data.locationGroup.name} meta="Your location group" /> : null}
        {data.joinedGroup ? <GroupCard href={`/dashboard/community/discipleship/${data.joinedGroup.groupId}`} prefetch={false} art="discipleship" title={data.joinedGroup.groupName} meta="You're a member" /> : null}
        {data.ledGroups.map((group, index) => <GroupCard key={`led-${group.groupId}`} href={`/dashboard/community/discipleship/${group.groupId}`} prefetch={false} art="leading" colourway={leadColourways[index % leadColourways.length]} title={group.groupName} meta={group.discipleCount ? `${group.discipleCount} ${group.discipleCount === 1 ? "disciple" : "disciples"}` : "Invite your first disciple"} />)}
        {data.memberGroups.map(group => <GroupCard key={`member-${group.id}`} href={`/dashboard/community/groups/${group.id}`} art={group.privacy === "private" ? "private" : "public"} title={group.name} meta={group.viewerRole === "owner" ? "You own this group" : group.viewerRole === "moderator" ? "You moderate" : "Member"} />)}
        <Link href="/dashboard/community/groups?create=1" className={styles.newGroup}>
          <span className={styles.newGroupIcon}><DashboardIcon name="plus" size={16} /></span>
          New group
        </Link>
      </div>
    </section>

    {people ? <PeopleToBringInPanel people={people} id="community-people" /> : null}

    {data.church ? <section className={styles.block} aria-labelledby="community-oversight">
      <div className={styles.blockHeading}><h2 id="community-oversight">Oversight</h2></div>
      <div className={styles.oversightPanel}>
        {data.church ? <OversightRow href={data.church.href} title="Church oversight" description="Your branch and workers" icon="network" tone="lilac" /> : null}
      </div>
    </section> : null}
  </div>;
}
