import Link from "next/link";

import { StaffInviteAcceptForm } from "@/components/ppc/staff-invite-accept-form";
import { getStaffInviteByToken } from "@/lib/db/queries/staff-invites";
import { getStaffInviteStatus } from "@/lib/staff-invites";

type StaffInvitePageProps = {
  params: Promise<{
    token: string;
  }>;
};

export default async function StaffInvitePage({ params }: StaffInvitePageProps) {
  const { token } = await params;
  const invite = await getStaffInviteByToken(token);
  const status = invite ? getStaffInviteStatus(invite) : null;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md items-center px-5 py-10">
      <section className="w-full rounded-sm border border-zinc-200 bg-white p-6 shadow-sm">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
          PPC staff invite
        </p>
        <h1 className="mt-2 text-xl font-semibold tracking-tight text-zinc-950">
          Set your password
        </h1>

        {!invite || status !== "pending" ? (
          <div className="mt-4 grid gap-3">
            <div className="rounded-sm border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
              This invite is {status ?? "invalid"}. Ask the super admin for a new invite.
            </div>
            <Link
              href="/admin"
              className="inline-flex h-8 items-center justify-center rounded-sm border border-zinc-200 px-3 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
            >
              Back to admin login
            </Link>
          </div>
        ) : (
          <StaffInviteAcceptForm
            token={token}
            email={invite.email}
            role={invite.role}
          />
        )}
      </section>
    </main>
  );
}

