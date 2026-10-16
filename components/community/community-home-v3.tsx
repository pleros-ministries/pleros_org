import Link from "next/link";
import { DashboardIcon } from "@/components/dashboard/v3/primitives";
import type { CommunityHomeData } from "@/lib/db/queries/community-home";
import styles from "./community-home-v3.module.css";

type IconName = Parameters<typeof DashboardIcon>[0]["name"];

function HomeRow({ href, title, description, icon, prefetch }: {
  href: string; title: string; description: string; icon: IconName; prefetch?: boolean;
}) {
  return <Link href={href} prefetch={prefetch} className={styles.row}>
    <span className={styles.icon}><DashboardIcon name={icon} /></span>
    <span className={styles.copy}><span className={styles.rowTitle}>{title}</span><span className={styles.meta}>{description}</span></span>
    <span className={styles.icon}><DashboardIcon name="right" size={16} /></span>
  </Link>;
}

export function CommunityHomeV3({ data }: { data: CommunityHomeData }) {
  const hasGroups = data.locationGroup || data.joinedGroup || data.ledGroups.length || data.memberGroups.length;
  return <div className={styles.home} data-community-home-v3>
    <header className={styles.heading}>
      <h1>Growing together.</h1>
      <p>Your shared journey in purpose.</p>
    </header>

    <Link href="/dashboard/community/messages" className={styles.messages}>
      <span className={styles.icon}><DashboardIcon name="chat" /></span>
      <span className={styles.copy}><span className={styles.rowTitle}>Messages</span><span className={styles.meta}>{data.unreadConversations ? `${data.unreadConversations} unread conversation${data.unreadConversations === 1 ? "" : "s"}` : "No unread conversations"}</span></span>
      {data.unreadConversations > 0 ? <span className={styles.badge}>{data.unreadConversations}</span> : <span className={styles.icon}><DashboardIcon name="right" size={16} /></span>}
    </Link>

    <section className={styles.section} aria-labelledby="community-responses">
      <div className={styles.sectionHeading}><h2 id="community-responses">Needs a response</h2>{data.responses.length > 0 ? <Link href="/dashboard/sogp/discipleship#check-ins" prefetch={false}>View all</Link> : null}</div>
      {data.responses.length || data.invitations.length ? <div className={styles.responseList}>{data.invitations.map(invitation => <article className={styles.response} key={`invitation-${invitation.id}`}>
        <Link className={styles.person} href={`/dashboard/sogp/invitations/${invitation.id}`} prefetch={false}>
          <span className={styles.avatar} aria-hidden="true">{invitation.leaderFirstName.slice(0, 2).toUpperCase()}</span>
          <span className={styles.copy}><span className={styles.rowTitle}>{invitation.leaderFirstName}</span><span className={styles.responseMeta}>Invited you to {invitation.groupName}</span></span>
          <span className={styles.blueIcon}><DashboardIcon name="leaf" /></span>
        </Link>
        <Link href={`/dashboard/sogp/invitations/${invitation.id}`} prefetch={false} className={styles.responseAction}>View invitation<DashboardIcon name="right" size={16} /></Link>
      </article>)}{data.responses.map(response => <article className={styles.response} key={response.id}>
        <Link className={styles.person} href={response.href} prefetch={false}>
          <span className={styles.avatar} aria-hidden="true">{response.firstName.slice(0, 2).toUpperCase()}</span>
          <span className={styles.copy}><span className={styles.rowTitle}>{response.firstName}</span><span className={styles.responseMeta}>New private check-in</span></span>
          <span className={styles.blueIcon}><DashboardIcon name="chat" /></span>
        </Link>
        <Link href={response.href} prefetch={false} className={styles.responseAction}>View check-in<DashboardIcon name="right" size={16} /></Link>
      </article>)}</div> : <div className={styles.empty}><p>You’re all caught up.</p><span className={styles.meta}>No private check-ins waiting for your reply.</span></div>}
    </section>

    {data.disciplesEnabled || data.church ? <section className={styles.section} aria-labelledby="community-leading">
      <div className={styles.sectionHeading}><h2 id="community-leading">People I lead</h2></div>
      <div className={styles.leadPanel}>
        {data.disciplesEnabled ? <HomeRow href="/dashboard/sogp/discipleship" prefetch={false} title="My disciples" description={`${data.discipleCount} ${data.discipleCount === 1 ? "person" : "people"} · You lead`} icon="leaf" /> : null}
        {data.disciplesEnabled ? <HomeRow href="/dashboard/sogp/enrollees" title="My enrollees" description={data.enrolleeCount ? `${data.enrolleeCount} ${data.enrolleeCount === 1 ? "person" : "people"} · You follow up` : "Share your referral code"} icon="people" /> : null}
        {data.church ? <HomeRow href={data.church.href} title={data.church.label} description="Your church responsibilities" icon="building" /> : null}
      </div>
    </section> : null}

    <section className={styles.section} aria-labelledby="community-groups">
      <div className={styles.sectionHeading}><h2 id="community-groups">My groups</h2><Link href="/dashboard/community/groups">See all</Link></div>
      <div className={styles.groupList}>
        {data.locationGroup ? <HomeRow href={`/dashboard/community/unit/${data.locationGroup.id}`} title={data.locationGroup.name} description="Location community · Member" icon="people" /> : null}
        {data.joinedGroup ? <HomeRow href={`/dashboard/community/discipleship?group=${data.joinedGroup.groupId}`} title={data.joinedGroup.groupName} description="Discipleship group · Member" icon="leaf" /> : null}
        {data.ledGroups.map(group => <HomeRow key={`led-${group.groupId}`} href={group.discipleCount ? `/dashboard/community/discipleship?group=${group.groupId}` : `/dashboard/sogp/discipleship?group=${group.groupId}`} prefetch={false} title={group.groupName} description="Discipleship group · You lead" icon="leaf" />)}
        {data.memberGroups.map(group => <HomeRow key={`member-${group.id}`} href={`/dashboard/community/groups/${group.id}`} title={group.name} description={`${group.privacy === "private" ? "Private" : "Public"} group · ${group.viewerRole === "owner" ? "You lead" : group.viewerRole === "moderator" ? "Moderator" : "Member"}`} icon="people" />)}
        {!hasGroups ? <p className={styles.empty}>You’re not in a group yet.</p> : null}
      </div>
    </section>

    <nav className={styles.contextLinks} aria-label="Community conversations">
      <Link href="/dashboard/community/feed">Community feed</Link>
      <Link href="/dashboard/community/ask">Ask Pleros</Link>
    </nav>
  </div>;
}
