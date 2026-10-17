import { redirect } from "next/navigation";

/** Saved contacts moved under Groups (17 October); old links keep working. */
export default function OldSavedContacts() {
  redirect("/dashboard/community/contacts");
}
