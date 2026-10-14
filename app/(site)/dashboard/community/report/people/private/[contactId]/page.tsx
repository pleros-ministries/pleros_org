import Link from "next/link";
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
  return <div className="mx-auto grid max-w-160 gap-4 p-4">
    <Link className="text-[13px] text-(--color-brand-blue) underline" href="/dashboard/community/report/people">Back to saved contacts</Link>
    <h1 className="text-[24px] leading-8 font-medium">{detail.contact.name}</h1>
    <p className="text-[13px] text-(--color-text-muted)">Private to you · No account or membership created</p>
    <a className="min-h-11 text-(--color-brand-blue) underline" href={phoneHref(detail.contact.phone) ?? undefined}>{detail.contact.phone}</a>
    {detail.contact.email ? <p>{detail.contact.email}</p> : null}
    {detail.contact.note ? <p className="whitespace-pre-wrap">{detail.contact.note}</p> : null}
    <h2 className="text-[15px] font-medium">Report history</h2>
    {detail.history.length ? <ul className="grid gap-3">{detail.history.map(row => <li key={row.activityId}><Link className="inline-flex min-h-11 items-center text-(--color-brand-blue) underline" href={`/dashboard/community/report/${row.activityId}`}>{row.date} · {row.kind.replaceAll("_", " ")}</Link></li>)}</ul> : <p className="text-[13px] text-(--color-text-muted)">No reports linked yet.</p>}
  </div>;
}
