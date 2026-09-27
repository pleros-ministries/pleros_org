import Link from "next/link";
import { cookies } from "next/headers";

import {
  evaluateJoinForViewer,
  getDiscipleshipInvite,
} from "@/lib/db/queries/sogp-discipleship";
import {
  DISCIPLESHIP_INVITE_COOKIE,
  buildDiscipleshipInvitePath,
  isValidInviteCode,
} from "@/lib/sogp/discipleship";

/**
 * Reminds a newly enrolled learner to finish joining the discipleship group
 * whose link brought them in. Joining still needs explicit confirmation on the
 * invite page, so this only links there.
 */
export async function DiscipleshipInviteBanner({ enrollmentId }: { enrollmentId: number }) {
  const code = (await cookies()).get(DISCIPLESHIP_INVITE_COOKIE)?.value;
  if (!isValidInviteCode(code)) return null;

  const invite = await getDiscipleshipInvite(code);
  if (!invite) return null;
  const decision = await evaluateJoinForViewer(invite, enrollmentId);
  if (!decision.ok) return null;

  return (
    <section className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-md)] border border-[var(--color-line)] bg-[var(--color-brand-sky-soft)] p-4">
      <div className="grid gap-0.5">
        <p className="text-sm font-semibold text-[var(--color-text-strong)]">
          Finish joining {invite.leaderFirstName}&apos;s discipleship group
        </p>
        <p className="text-xs text-[var(--color-text-muted)]">
          {invite.leaderFirstName} invited you to walk through SOGP together.
        </p>
      </div>
      <Link
        href={buildDiscipleshipInvitePath(code)}
        className="inline-flex min-h-9 items-center rounded-full bg-[var(--color-brand-blue)] px-4 text-xs font-medium text-white"
      >
        Review and join
      </Link>
    </section>
  );
}
