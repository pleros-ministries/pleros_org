import { redirect } from "next/navigation";

// Reads the session or params on every request (Cache Components).
export const instant = false;

/** Saved contacts moved under Groups (17 October); old links keep working. */
export default function OldSavedContacts() {
  redirect("/dashboard/community/contacts");
}
