import { redirect } from "next/navigation";

// Reads the session or params on every request (Cache Components).
export const instant = false;

/** Saved contacts moved under Groups (17 October); old links keep working. */
export default async function OldContactInvite({ params, searchParams }: { params: Promise<{ contactId: string }>; searchParams: Promise<{ group?: string }> }) {
  const [{ contactId }, { group }] = await Promise.all([params, searchParams]);
  redirect(`/dashboard/community/contacts/${encodeURIComponent(contactId)}/invite${group && /^\d{1,9}$/.test(group) ? `?group=${group}` : ""}`);
}
