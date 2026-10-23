import Link from "next/link";
import { DashboardIcon } from "@/components/dashboard/v3/primitives";
import type { CommunityHomeData } from "@/lib/db/queries/community-home";
import styles from "./community-home-v3.module.css";
import { GroupCard } from "./community-home-cards";
import { CommunityCounts, LedGroupCards } from "./community-home-parts";
import { PeopleToBringInPanel, type PeopleToBringIn } from "./people/people-to-bring-in";

type IconName = Parameters<typeof DashboardIcon>[0]["name"];
export { GroupCard, leadColourways, type GroupArt } from "./community-home-cards";

function OversightRow({ href, title, description, icon, tone, prefetch }: { href: string; title: string; description: string; icon: IconName; tone: string; prefetch?: false }) {
  return <Link href={href} prefetch={prefetch} className={styles.oversightRow}>
    <span className={styles.oversightIcon} data-tone={tone}><DashboardIcon name={icon} size={16} strokeWidth={2} /></span>
    <span className={styles.copy}><span className={styles.oversightTitle}>{title}</span><span className={styles.meta}>{description}</span></span>
    <DashboardIcon name="right" size={16} />
  </Link>;
}


/**
 * Groups as oversight (Pastor, 19 October): the group you're in, whose leader
 * looks after you, then the groups you lead with "+ New group". Location and
 * interest groups stay as they are.
 */
function OversightGroups({ data }: { data: CommunityHomeData }) {
  const newGroupHref = data.ledGroups.length ? "/dashboard/community/groups/new" : "/dashboard/sogp/discipleship";
  return <>
    {data.joinedGroup || data.locationGroup ? <section className={styles.block} aria-labelledby="community-your-group">
      <div className={styles.blockHeading}><h2 id="community-your-group">Groups you’re under</h2><Link href="/dashboard/community/groups">See all</Link></div>
      <div className={styles.groupGrid}>
        {data.joinedGroup ? <GroupCard href={`/dashboard/community/discipleship/${data.joinedGroup.groupId}`} prefetch={false} art="discipleship" tag="Your group" title={data.joinedGroup.groupName} meta={`Led by ${data.joinedGroup.leaderFirstName}`} /> : null}
        {data.locationGroup ? <GroupCard href={`/dashboard/community/unit/${data.locationGroup.id}`} art="location" title={data.locationGroup.name} meta="Your location group" /> : null}
      </div>
    </section> : null}
    <section className={styles.block} aria-labelledby="community-led-groups">
      <div className={styles.blockHeading}><h2 id="community-led-groups">Groups you lead</h2>{data.joinedGroup || data.locationGroup ? null : <Link href="/dashboard/community/groups">See all</Link>}</div>
      <LedGroupCards groups={data.ledGroups} newGroupHref={newGroupHref}
        extra={data.managedLocations.map(unit => <GroupCard key={`unit-${unit.id}`} href={`/dashboard/community/unit/${unit.id}`} art="location" tag="You look after" title={unit.name} meta="Location group" />)} />
    </section>
    {data.memberGroups.length ? <section className={styles.block} aria-labelledby="community-other-groups">
      <div className={styles.blockHeading}><h2 id="community-other-groups">Interest groups</h2><Link href="/dashboard/community/groups">See all</Link></div>
      <div className={styles.groupGrid}>
        {data.memberGroups.map(group => <GroupCard key={`member-${group.id}`} href={`/dashboard/community/groups/${group.id}`} art={group.privacy === "private" ? "private" : "public"} title={group.name} meta={group.viewerRole === "owner" ? "You own this group" : group.viewerRole === "moderator" ? "You moderate" : "Member"} />)}
      </div>
    </section> : null}
  </>;
}

export function CommunityHomeV3({ data, people = null }: { data: CommunityHomeData; people?: PeopleToBringIn | null }) {
  const firstInvitation = data.invitations[0];
  return <div className={styles.home} data-community-home-v3>
    <header className={styles.heading}>
      <h1>Your Pleros Community</h1>
    </header>

    {/* Needs you is the third count, dropping down to the people (Pastor, 22 October). */}
    <CommunityCounts data={data} updatesHref={data.church ? "/dashboard/community/oversight/updates" : null} />

    {/* With Invitations off the counts, a waiting invitation shows here only when there is one. */}
    {firstInvitation ? <Link href={`/dashboard/sogp/invitations/${firstInvitation.id}`} prefetch={false} className={`${styles.oversightRow} mt-3`}>
      <span className={styles.oversightIcon} data-tone="blue"><DashboardIcon name="mail" size={16} strokeWidth={2} /></span>
      <span className={styles.copy}><span className={styles.oversightTitle}>{data.invitations.length === 1 ? "You’re invited to a group" : `${data.invitations.length} group invitations`}</span><span className={styles.meta}>Open to accept or decline</span></span>
      <DashboardIcon name="right" size={16} />
    </Link> : null}

    <OversightGroups data={data} />

    {people ? <PeopleToBringInPanel people={people} id="community-people" /> : null}

    {data.church ? <section className={styles.block} aria-labelledby="community-oversight">
      <div className={styles.blockHeading}><h2 id="community-oversight">Oversight</h2></div>
      <div className={styles.oversightPanel}>
        {data.church ? <OversightRow href={data.church.href} title="Oversight" description="Reports from the people in your groups" icon="network" tone="lilac" /> : null}
      </div>
    </section> : null}
  </div>;
}
