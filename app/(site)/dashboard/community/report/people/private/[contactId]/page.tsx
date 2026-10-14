import { SavedContactDetailView } from "@/components/community/report/ministry-v3/saved-contacts";
import { notFound, redirect } from "next/navigation";
import { getAppSession } from "@/lib/app-session";
import { getPrivateMinistryContact } from "@/lib/db/queries/private-ministry-contacts";
import { reportingV3SchemaReady } from "@/lib/db/queries/reporting-v3-gate";
import { CommunityError } from "@/lib/community/errors";
import { phoneHref } from "@/lib/community/outreach-contacts";

export default async function PrivateContactPage({ params }: { params: Promise<{ contactId: string }> }) {
  const session = await getAppSession();
  if (!session) redirect("/login?returnTo=/dashboard/community/report/people");
  if (!reportingV3SchemaReady()) notFound();
  const id = Number((await params).contactId);
  if (!Number.isSafeInteger(id) || id <= 0) notFound();
  const detail = await getPrivateMinistryContact(session.user.id, id).catch(error => { if (error instanceof CommunityError) return null; throw error; });
  if (!detail) notFound();
  return <SavedContactDetailView contact={{ name: detail.contact.name, phone: detail.contact.phone, email: detail.contact.email, note: detail.contact.note, createdAt: detail.contact.createdAt, phoneHref: phoneHref(detail.contact.phone) ?? null, history: detail.history.map(row => ({ activityId: row.activityId, date: row.date, kind: row.kind })) }} />;
}
