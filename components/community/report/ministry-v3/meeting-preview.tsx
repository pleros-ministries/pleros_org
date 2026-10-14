"use client";
import { MeetingChooser } from "./meeting-chooser";
import { MeetingReportForm, type SharedMeetingView } from "./meeting-form";
import styles from "./ministry-form.module.css";

const teaching: SharedMeetingView = { id: 1, unitId: 1, kind: "teaching_meeting", meetingDate: "2026-10-13", subject: "The life of faith", venue: null, startsAt: null, endsAt: null, totalAttendance: 0, creatorName: "Ruth Akinola" };
const prayer: SharedMeetingView = { id: 2, unitId: 1, kind: "prayer_meeting", meetingDate: "2026-10-13", subject: null, venue: "Yaba fellowship hall, Lagos", startsAt: "2026-10-13T18:00:00+01:00", endsAt: "2026-10-13T19:15:00+01:00", totalAttendance: 0, creatorName: "Kunle Adebayo" };
const contact = (name: string) => ({ key: `sample-${name}`, name, phone: "+234 800 000 0103", email: null, note: null });
const noSave = async () => ({ ok: false as const, error: "Preview only. Nothing is saved." });

/** Synthetic adapter only: no DB, auth or actions. */
export function MeetingPreview({ screen }: { screen: string }) {
  if (screen === "select" || screen === "missing") return <section className={styles.form}>
    <div className={styles.titleBlock}><h1>Choose a meeting</h1><p className={styles.muted}>For workers and disciples. Choose a meeting created by the person who led it.</p></div>
    <MeetingChooser meetings={screen === "missing" ? [] : [teaching, prayer]} onChoose={() => undefined} onRefresh={() => undefined} />
  </section>;
  const prayerScreen = screen.startsWith("prayer");
  const led = screen.endsWith("led");
  return <MeetingReportForm creating={led} initialKind={prayerScreen ? "prayer_meeting" : "teaching_meeting"} dateKey="2026-10-13" meeting={led ? undefined : prayerScreen ? prayer : teaching}
    contacts={[]} selectedContacts={[contact(prayerScreen ? "Tomi Adebayo" : "Kemi Adewale")]} initialReport={led ? undefined : { attended: true, participation: prayerScreen ? "disciple" : "worker" }}
    onSave={noSave} onCancel={() => undefined} />;
}
