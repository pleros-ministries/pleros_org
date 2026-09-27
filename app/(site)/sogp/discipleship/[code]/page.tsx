import type { Metadata } from "next";
import Link from "next/link";

import { HomepageFooter } from "@/components/home/homepage-footer";
import { PublicSitePageShell } from "@/components/home/public-site-page-shell";
import { DiscipleshipJoinForm } from "@/components/sogp/discipleship-join-form";
import { getAppSession } from "@/lib/app-session";
import { getSogpEnrollmentByUserId } from "@/lib/db/queries/sogp";
import {
  evaluateJoinForViewer,
  getDiscipleshipInvite,
} from "@/lib/db/queries/sogp-discipleship";
import {
  buildDiscipleshipInvitePath,
  discipleshipJoinBlockMessage,
  isValidInviteCode,
} from "@/lib/sogp/discipleship";

export const metadata: Metadata = {
  title: "Join a SOGP discipleship group",
  description: "Walk through the School of God's Purpose with someone who cares about your growth.",
  robots: { index: false },
};

const WHAT_THEY_SEE = [
  "Your progress: Pre-SOGP days, Morning Prayer Watch, reviews and assessments completed",
  "Your average assessment score and certificate progress",
  "Your answers to their check-in questions",
];

export default async function DiscipleshipInvitePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const invite = isValidInviteCode(code) ? await getDiscipleshipInvite(code) : null;

  return (
    <PublicSitePageShell>
      <main className="site-font-theme min-h-[75vh] bg-[var(--color-surface-muted)] py-10 md:py-16">
        <section className="site-shell-page sogp-shell-page grid place-items-center">
          <div className="w-full max-w-[32rem] rounded-[var(--radius-md)] border border-[var(--color-line)] bg-white p-6 shadow-[var(--shadow-sm)] sm:p-8">
            {invite ? <InviteBody code={code} invite={invite} /> : <InvalidInvite />}
          </div>
        </section>
      </main>
      <HomepageFooter />
    </PublicSitePageShell>
  );
}

function InvalidInvite() {
  return (
    <div className="grid gap-3">
      <h1 className="font-[var(--font-sen)] text-2xl font-semibold tracking-[-0.04em] text-[var(--color-text-strong)]">
        This invite link isn&apos;t valid
      </h1>
      <p className="font-[var(--font-be-vietnam-pro)] [font-size:0.875rem] leading-[1.55] text-[var(--color-text-muted)]">
        Ask the person who shared it for a fresh link, or explore SOGP on your own.
      </p>
      <Link
        href="/sogp"
        className="[font-size:0.8125rem] font-medium text-[var(--color-brand-blue)] underline underline-offset-4"
      >
        Discover SOGP
      </Link>
    </div>
  );
}

async function InviteBody({
  code,
  invite,
}: {
  code: string;
  invite: NonNullable<Awaited<ReturnType<typeof getDiscipleshipInvite>>>;
}) {
  const session = await getAppSession();
  const enrollment = session ? await getSogpEnrollmentByUserId(session.user.id) : null;
  const decision = enrollment ? await evaluateJoinForViewer(invite, enrollment.id) : null;
  const name = invite.leaderFirstName;

  return (
    <div className="grid gap-6">
      <div className="grid gap-2">
        <p className="[font-size:0.75rem] font-semibold uppercase tracking-[0.14em] text-[var(--color-brand-blue)]">
          SOGP discipleship
        </p>
        <h1 className="font-[var(--font-sen)] text-2xl font-semibold tracking-[-0.04em] text-[var(--color-text-strong)]">
          {name} has invited you to their discipleship group
        </h1>
        <p className="font-[var(--font-be-vietnam-pro)] [font-size:0.875rem] leading-[1.55] text-[var(--color-text-muted)]">
          Walk through the School of God&apos;s Purpose together. {name} will encourage you,
          check in with you, and help you keep going.
        </p>
      </div>

      <div className="grid gap-2 rounded-[var(--radius-sm)] border border-[var(--color-line)] bg-[var(--color-surface-muted)] p-4">
        <p className="[font-size:0.8125rem] font-medium text-[var(--color-text-strong)]">
          What {name} will see
        </p>
        <ul className="grid list-disc gap-1 pl-4 [font-size:0.75rem] leading-[1.5] text-[var(--color-text-muted)]">
          {WHAT_THEY_SEE.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p className="[font-size:0.75rem] leading-[1.5] text-[var(--color-text-muted)]">
          {name} won&apos;t see your quiz answers, written responses or email address. You can
          leave the group at any time.
        </p>
      </div>

      {!session ? (
        <div className="grid gap-3">
          <Link
            href={`/sogp/discipleship/${code}/enrol`}
            className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-[var(--color-brand-blue)] [font-size:0.875rem] font-medium text-white"
          >
            Enrol for free and join
          </Link>
          <p className="[font-size:0.8125rem] text-[var(--color-text-muted)]">
            Already enrolled?{" "}
            <Link
              href={`/login?returnTo=${encodeURIComponent(buildDiscipleshipInvitePath(code))}`}
              className="font-medium text-[var(--color-brand-blue)] underline underline-offset-4"
            >
              Log in to join
            </Link>
          </p>
        </div>
      ) : !enrollment ? (
        <Link
          href={`/sogp/discipleship/${code}/enrol`}
          className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-[var(--color-brand-blue)] [font-size:0.875rem] font-medium text-white"
        >
          Enrol in SOGP to join
        </Link>
      ) : decision && !decision.ok ? (
        <div className="grid gap-3">
          <p
            role="status"
            className="rounded-[var(--radius-sm)] border border-[var(--color-line)] bg-[var(--color-brand-sky-soft)] px-4 py-2.5 [font-size:0.8125rem] leading-[1.5] text-[var(--color-brand-blue)]"
          >
            {discipleshipJoinBlockMessage(decision.reason)}
          </p>
          <Link
            href="/dashboard/sogp/discipleship"
            className="[font-size:0.8125rem] font-medium text-[var(--color-brand-blue)] underline underline-offset-4"
          >
            Go to discipleship
          </Link>
        </div>
      ) : (
        <DiscipleshipJoinForm code={code} leaderFirstName={name} />
      )}
    </div>
  );
}
