import { dashboardFont } from "@/components/dashboard/v3/font";
import styles from "@/components/dashboard/v3/dashboard.module.css";
import { ShareReferral } from "@/components/sogp/share-referral";
import { FollowUpWelcome, InvitationResponse, InviteEnrollee, MyEnrollees, SentInvitationView } from "@/components/sogp/follow-up-invitations";

export const metadata = { title: "Follow-up and invitations visual preview", robots: { index: false, follow: false } };

const now = new Date().toISOString();
const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString();

/** Labelled sample data only: buttons call live actions, which refuse without a matching session. */
export default async function Preview({ searchParams }: { searchParams: Promise<{ screen?: string }> }) {
  const { screen = "code" } = await searchParams;
  const body = screen === "share" ? <ShareReferral code="TOLU26" url="https://example.com/sogp?ref=TOLU26" referredCount={3} />
    : screen === "link"
    ? <FollowUpWelcome data={{ learnerFirstName: "Dayo", source: "link", ownerName: "Efe Daniels", ownerCode: null, choice: null, ownerCurrent: true }} />
    : screen === "enrollees"
      ? <MyEnrollees referralCode="NNEKA26" referralUrl="https://example.com/sogp?ref=NNEKA26" rows={[
        { enrollmentId: 1, name: "Dayo Eze", source: "code", assignedAt: now, lastContactedAt: null, group: null, invited: false },
        { enrollmentId: 2, name: "Miriam Ibe", source: "reassigned", assignedAt: now, lastContactedAt: null, group: null, invited: false },
        { enrollmentId: 3, name: "Tosin Ade", source: "link", assignedAt: daysAgo(9), lastContactedAt: daysAgo(3), group: null, invited: false },
      ]} />
      : screen === "accept-move"
        ? <InvitationResponse invitation={{ id: 1, status: "pending", origin: "in_app", createdAt: now, groupName: "Campus fellowship", leaderName: "Tolu Adeyemi", groupAvailable: true, currentGroup: { id: 2, name: "Efe’s discipleship group", leaderName: "Efe Daniels" } }} />
      : screen === "accept"
        ? <InvitationResponse invitation={{ id: 1, status: "pending", origin: "in_app", createdAt: now, groupName: "Tolu’s discipleship group", leaderName: "Tolu Adeyemi", groupAvailable: true, currentGroup: null }} />
        : screen === "invite"
          ? <InviteEnrollee enrollee={{ enrollmentId: 1, name: "Daniel Okon", maskedEmail: "d•••@example.com" }} groups={[{ id: 1, name: "Tolu’s discipleship group" }]} leaderName="Tolu Adeyemi" />
          : screen === "pending"
            ? <SentInvitationView invitation={{ id: 1, status: "pending", createdAt: now, respondedAt: null, groupId: 1, groupName: "Tolu’s discipleship group", leaderName: "Tolu Adeyemi", recipientName: "Daniel Okon" }} />
            : <FollowUpWelcome data={{ learnerFirstName: "Dayo", source: "code", ownerName: "Nneka Adeyemi", ownerCode: "NNEKA26", choice: null, ownerCurrent: true }} />;
  return <div className={`${dashboardFont.className} ${styles.root}`} data-dashboard-v3><p className="px-4 py-2 text-xs text-(--color-text-muted)">Visual preview · sample data · nothing saved</p>{body}</div>;
}
