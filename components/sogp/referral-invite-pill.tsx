/** "Daniel invited you": shown on the public SOGP pages when a friend opens a referral link. */
export function ReferralInvitePill({ firstName }: { firstName: string }) {
  return (
    <p className="inline-flex w-fit max-w-full items-center gap-2 rounded-full bg-[var(--color-brand-blue)] py-1 pl-1 pr-3.5 font-[var(--font-be-vietnam-pro)] [font-size:0.8125rem] font-medium text-white">
      <span aria-hidden="true" className="grid size-6 shrink-0 place-items-center rounded-full bg-white text-[0.6875rem] text-[var(--color-brand-blue)]">{firstName.slice(0, 1).toUpperCase()}</span>
      <span className="truncate">{firstName} invited you to SOGP</span>
    </p>
  );
}
