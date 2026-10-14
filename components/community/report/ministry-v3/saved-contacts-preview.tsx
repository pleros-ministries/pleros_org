"use client";
import { AddSavedContact, SavedContactDetailView, SavedContacts } from "./saved-contacts";

const sample = [
  { key: "private:1", name: "Adaeze Bello", phone: "+234 800 000 0102", email: "adaeze@example.com", note: null },
  { key: "private:2", name: "Daniel Okon", phone: "+234 800 000 0103", email: null, note: null },
  { key: "private:3", name: "Samuel Musa", phone: "+234 800 000 0105", email: null, note: null },
];

/** Synthetic adapter only: no DB, auth or actions. */
export function SavedContactsPreview({ screen }: { screen: string }) {
  if (screen === "add") return <AddSavedContact onPersist={async () => ({ ok: false, error: "Preview only. Nothing is saved." })} />;
  if (screen === "detail") return <SavedContactDetailView contact={{ name: "Adaeze Bello", phone: "+234 800 000 0102", email: "adaeze@example.com", note: "Met at the community gathering.\nFollow up about meeting next week.", createdAt: "2026-10-13T09:24:00Z", phoneHref: "tel:+2348000000102", history: [{ activityId: 1, date: "2026-10-13", kind: "outreach" }] }} />;
  return <SavedContacts contacts={sample} readOnly={false} />;
}
