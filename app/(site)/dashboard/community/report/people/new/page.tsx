import { redirect } from "next/navigation";

// Reads the session or params on every request (Cache Components).
export const instant = false;

/** Saved contacts moved under Groups (17 October); old links keep working. */
export default async function OldAddContact({ searchParams }: { searchParams: Promise<{ invite?: string }> }) {
  const { invite } = await searchParams;
  redirect(`/dashboard/community/contacts/new${invite && /^\d{1,9}$/.test(invite) ? `?invite=${invite}` : ""}`);
}
