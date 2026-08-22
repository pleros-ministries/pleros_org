import Link from "next/link";
import { redirect } from "next/navigation";

import { PageHeader } from "@/components/ppc/page-header";
import { StatusBadge } from "@/components/ppc/status-badge";
import { Button } from "@/components/ui/button";
import { getAppSession } from "@/lib/app-session";
import {
  getContactStatusVariant,
  type ContactSubmissionStatus,
} from "@/lib/contact-submissions";
import {
  getContactSubmissionById,
  getContactSubmissionSummaries,
} from "@/lib/db/queries/contact-submissions";
import { updateContactSubmissionStatusAction } from "@/app/_actions/contact-actions";

type AdminContactPageProps = {
  searchParams: Promise<{
    submission?: string;
  }>;
};

function formatDate(value: Date | null) {
  if (!value) {
    return "Not yet";
  }

  return value.toISOString().replace("T", " ").slice(0, 16);
}

function StatusButton({
  submissionId,
  status,
  label,
}: {
  submissionId: number;
  status: ContactSubmissionStatus;
  label: string;
}) {
  return (
    <form action={updateContactSubmissionStatusAction}>
      <input type="hidden" name="submissionId" value={String(submissionId)} />
      <input type="hidden" name="status" value={status} />
      <Button type="submit" variant="secondary" size="sm">
        {label}
      </Button>
    </form>
  );
}

export default async function AdminContactPage({
  searchParams,
}: AdminContactPageProps) {
  const session = await getAppSession();
  if (!session) {
    redirect("/admin");
  }
  if (session.user.role === "student") {
    redirect("/ppc");
  }

  const resolvedSearchParams = await searchParams;
  const submissions = await getContactSubmissionSummaries();
  const selectedId = Number(resolvedSearchParams.submission ?? submissions[0]?.id ?? 0);
  const selectedSubmission =
    (Number.isFinite(selectedId) && selectedId > 0
      ? await getContactSubmissionById(selectedId)
      : null) ?? null;

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Contact submissions"
        description={`${submissions.length} public messages`}
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
        <section className="rounded-sm border border-zinc-200 bg-white">
          <div className="border-b border-zinc-100 px-4 py-3">
            <h2 className="ppc-heading text-sm font-semibold text-zinc-900">Inbox</h2>
            <p className="mt-0.5 text-xs text-zinc-500">
              Public leads and ministry contact messages
            </p>
          </div>

          <div className="divide-y divide-zinc-100">
            {submissions.length === 0 ? (
              <div className="px-4 py-10 text-sm text-zinc-500">
                No contact submissions yet.
              </div>
            ) : (
              submissions.map((submission) => {
                const isActive = submission.id === selectedSubmission?.id;

                return (
                  <Link
                    key={submission.id}
                    href={`/admin/contact?submission=${submission.id}`}
                    className={`block px-4 py-3 transition-colors ${
                      isActive ? "bg-zinc-50" : "hover:bg-zinc-50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-zinc-900">
                          {submission.fullName}
                        </p>
                        <p className="truncate text-xs text-zinc-500">
                          {submission.email}
                        </p>
                      </div>
                      <StatusBadge
                        status={submission.isSpam ? "spam" : submission.status}
                        variant={getContactStatusVariant(
                          submission.status,
                          submission.isSpam,
                        )}
                      />
                    </div>
                    <p className="mt-2 line-clamp-2 text-xs text-zinc-600">
                      {submission.messagePreview}
                    </p>
                    <p className="mt-2 text-[11px] text-zinc-400">
                      {formatDate(submission.createdAt)}
                    </p>
                  </Link>
                );
              })
            )}
          </div>
        </section>

        <section className="rounded-sm border border-zinc-200 bg-white">
          {!selectedSubmission ? (
            <div className="px-6 py-12 text-sm text-zinc-500">
              Select a contact submission to view the details.
            </div>
          ) : (
            <div className="grid gap-6 px-6 py-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="ppc-heading text-lg font-semibold text-zinc-950">
                    {selectedSubmission.fullName}
                  </h2>
                  <p className="mt-1 text-sm text-zinc-500">
                    Received {formatDate(selectedSubmission.createdAt)}
                  </p>
                </div>

                <StatusBadge
                  status={
                    selectedSubmission.isSpam
                      ? "spam"
                      : selectedSubmission.status
                  }
                  variant={getContactStatusVariant(
                    selectedSubmission.status,
                    selectedSubmission.isSpam,
                  )}
                />
              </div>

              <dl className="grid gap-3 rounded-sm border border-zinc-200 bg-zinc-50 p-4 sm:grid-cols-2">
                <div>
                  <dt className="text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-400">
                    Email
                  </dt>
                  <dd className="mt-1 text-sm text-zinc-800">
                    {selectedSubmission.email}
                  </dd>
                </div>
                <div>
                  <dt className="text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-400">
                    Phone
                  </dt>
                  <dd className="mt-1 text-sm text-zinc-800">
                    {selectedSubmission.phone}
                  </dd>
                </div>
                <div>
                  <dt className="text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-400">
                    Location
                  </dt>
                  <dd className="mt-1 text-sm text-zinc-800">
                    {selectedSubmission.location ?? "Not provided"}
                  </dd>
                </div>
                <div>
                  <dt className="text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-400">
                    Submit time
                  </dt>
                  <dd className="mt-1 text-sm text-zinc-800">
                    {selectedSubmission.submitDurationMs == null
                      ? "Unknown"
                      : `${selectedSubmission.submitDurationMs} ms`}
                  </dd>
                </div>
              </dl>

              <div className="grid gap-2">
                <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-400">
                  Message
                </p>
                <div className="rounded-sm border border-zinc-200 bg-white p-4 text-sm leading-6 text-zinc-800 whitespace-pre-wrap">
                  {selectedSubmission.message}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 xl:grid-cols-4">
                <div className="rounded-sm border border-zinc-200 bg-zinc-50 p-3">
                  <p className="text-[11px] uppercase tracking-[0.12em] text-zinc-400">
                    Read at
                  </p>
                  <p className="mt-1 text-sm text-zinc-800">
                    {formatDate(selectedSubmission.readAt)}
                  </p>
                </div>
                <div className="rounded-sm border border-zinc-200 bg-zinc-50 p-3">
                  <p className="text-[11px] uppercase tracking-[0.12em] text-zinc-400">
                    Resolved at
                  </p>
                  <p className="mt-1 text-sm text-zinc-800">
                    {formatDate(selectedSubmission.resolvedAt)}
                  </p>
                </div>
                <div className="rounded-sm border border-zinc-200 bg-zinc-50 p-3">
                  <p className="text-[11px] uppercase tracking-[0.12em] text-zinc-400">
                    Email notification
                  </p>
                  <p className="mt-1 text-sm text-zinc-800">
                    {selectedSubmission.notificationSentAt
                      ? `Sent ${formatDate(selectedSubmission.notificationSentAt)}`
                      : selectedSubmission.notificationFailure ?? "Pending"}
                  </p>
                </div>
                <div className="rounded-sm border border-zinc-200 bg-zinc-50 p-3">
                  <p className="text-[11px] uppercase tracking-[0.12em] text-zinc-400">
                    Spam reasons
                  </p>
                  <p className="mt-1 text-sm text-zinc-800">
                    {selectedSubmission.spamReasons.length > 0
                      ? selectedSubmission.spamReasons.join(", ")
                      : "None"}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 border-t border-zinc-100 pt-4">
                <StatusButton
                  submissionId={selectedSubmission.id}
                  status="new"
                  label="Mark as new"
                />
                <StatusButton
                  submissionId={selectedSubmission.id}
                  status="read"
                  label="Mark as read"
                />
                <StatusButton
                  submissionId={selectedSubmission.id}
                  status="resolved"
                  label="Mark as resolved"
                />
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
