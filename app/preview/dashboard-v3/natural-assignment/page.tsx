import { dashboardFont } from "@/components/dashboard/v3/font";
import styles from "@/components/dashboard/v3/dashboard.module.css";
import { NaturalAssignment } from "@/components/community/report/natural-assignment";
import type { NaturalAssignmentDay } from "@/lib/db/queries/natural-assignment";

export const metadata = { title: "Natural assignment preview", robots: { index: false, follow: false } };

// Reads searchParams on every request (Cache Components).
export const instant = false;

const SAMPLE: NaturalAssignmentDay = { date: "2026-10-20", goals: [
  { id: 1, title: "Prepare Sunday's youth teaching", outcome: "", todos: [
    { id: 11, text: "Read Ephesians 2 and outline three points", deadline: "10:00", done: true },
    { id: 12, text: "Send the outline to Pastor for review", deadline: "14:00", done: false },
  ] },
  { id: 2, title: "Follow up this week's new believers", outcome: "", todos: [
    { id: 21, text: "Call Chidi and Ruth", deadline: "17:00", done: false },
    { id: 22, text: "Invite them to Thursday's Bible study", deadline: null, done: false },
  ] },
] };

/** The real natural assignment page on sample data (`?stage=review`). Changes here don't save. */
export default async function NaturalAssignmentPreview({ searchParams }: { searchParams: Promise<{ stage?: string }> }) {
  const { stage } = await searchParams;
  return <div className={`${dashboardFont.className} ${styles.root}`} data-dashboard-v3>
    <p className="px-4 py-2 text-xs text-(--color-text-muted)">Preview · sample data · nothing saved</p>
    <div className="mx-auto w-full max-w-[640px] px-4 pt-[18px] pb-7">
      <NaturalAssignment initial={SAMPLE} writable initialStage={stage === "review" ? "review" : "plan"} dateLabel="Today · Tue 20 Oct" />
    </div>
  </div>;
}
