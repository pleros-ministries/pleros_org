import Link from "next/link";
import { requireAdmin } from "@/lib/auth/require-role";
import { listFollowUpOwnerCandidates, listFollowUpRequests } from "@/lib/db/queries/sogp-follow-up-requests";
import { FollowUpRequestQueue } from "@/components/ppc/follow-up-request-queue";

export default async function FollowUpRequestsPage() {
  await requireAdmin();
  const [requests, people] = await Promise.all([listFollowUpRequests(), listFollowUpOwnerCandidates()]);
  return <section className="mx-auto grid w-full max-w-3xl gap-6">
    <header><Link href="/admin/my-enrollees" className="inline-flex min-h-11 items-center text-sm text-(--color-brand-blue)">← Back to enrollees</Link><h1 className="text-2xl font-medium">Follow-up requests</h1><p className="mt-2 text-sm text-(--color-text-muted)">Review requests without changing church appointments or accepted group memberships.</p></header>
    <FollowUpRequestQueue requests={requests} people={people} />
  </section>;
}
