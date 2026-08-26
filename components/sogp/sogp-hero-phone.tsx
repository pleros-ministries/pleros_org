import { BookOpen, Headphones, MessageCircleMore, Radio } from "lucide-react";

export function SogpHeroPhone() {
  return (
    <div
      aria-hidden="true"
      className="relative mx-auto grid min-h-[25rem] w-full max-w-[27rem] place-items-center overflow-hidden lg:min-h-[34rem]"
    >
      <div className="absolute inset-x-[8%] inset-y-[10%] rotate-[-5deg] rounded-[2.25rem] bg-[var(--color-brand-sky)]" />

      <div className="relative z-10 h-[25.5rem] w-[13rem] rotate-[4deg] overflow-hidden rounded-[2.25rem] border-[0.48rem] border-[#07133f] bg-[var(--color-surface)] shadow-[0_26px_60px_rgba(5,20,128,0.2)] sm:h-[29rem] sm:w-[14.5rem]">
        <div className="absolute left-1/2 top-2 z-20 h-3.5 w-14 -translate-x-1/2 rounded-full bg-[#07133f]" />
        <div className="grid h-full grid-rows-[auto_1fr] bg-[var(--color-surface-muted)] pt-7">
          <div className="bg-white px-4 pb-5 pt-4">
            <p className="font-[var(--font-be-vietnam-pro)] text-[0.5rem] font-semibold uppercase tracking-[0.12em] text-[var(--color-brand-blue)]">
              SOGP dashboard
            </p>
            <p className="mt-2 font-[var(--font-sen)] text-[1.4rem] font-semibold leading-none tracking-[-0.055em] text-[var(--color-text-strong)]">
              Your journey
            </p>
          </div>
          <div className="grid content-start gap-2.5 p-3">
            <div className="rounded-[0.8rem] bg-[var(--color-brand-blue)] p-3.5 text-white">
              <div className="flex items-center gap-1.5 text-[0.48rem] font-semibold uppercase tracking-[0.1em] text-[var(--color-brand-lime)]">
                <BookOpen className="size-2.5" /> Today&apos;s track
              </div>
              <p className="mt-2 font-[var(--font-sen)] text-[0.82rem] font-semibold leading-[1.08]">
                Being Led by the Spirit of God
              </p>
              <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/20">
                <div className="h-full w-[42%] rounded-full bg-[var(--color-brand-lime)]" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-[0.65rem] border border-[var(--color-line)] bg-white p-2.5">
                <p className="text-[0.48rem] text-[var(--color-text-muted)]">Learning</p>
                <p className="mt-1 font-[var(--font-sen)] text-[0.72rem] font-semibold text-[var(--color-brand-blue)]">Day 08</p>
              </div>
              <div className="rounded-[0.65rem] border border-[var(--color-line)] bg-white p-2.5">
                <p className="text-[0.48rem] text-[var(--color-text-muted)]">Formation</p>
                <p className="mt-1 font-[var(--font-sen)] text-[0.72rem] font-semibold text-[var(--color-brand-blue)]">On track</p>
              </div>
            </div>
            <div className="rounded-[0.65rem] border border-[var(--color-line)] bg-white p-2.5">
              <div className="flex items-center gap-2">
                <Radio className="size-3 text-[var(--color-brand-blue)]" />
                <p className="text-[0.58rem] font-semibold text-[var(--color-text-strong)]">Saturday live class</p>
              </div>
              <p className="mt-1.5 text-[0.48rem] text-[var(--color-text-muted)]">Questions, teaching and cohort fellowship</p>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute right-0 top-[17%] z-20 w-[9.4rem] rounded-[0.9rem] border border-[var(--color-line)] bg-white p-3 shadow-[0_18px_38px_rgba(5,20,128,0.14)] sm:right-1">
        <MessageCircleMore className="size-4 text-[var(--color-brand-blue)]" />
        <p className="mt-2 text-[0.55rem] text-[var(--color-text-muted)]">Telegram community</p>
        <p className="mt-1 font-[var(--font-sen)] text-[0.68rem] font-semibold leading-[1.1] text-[var(--color-text-strong)]">Updates and cohort connection</p>
      </div>

      <div className="absolute bottom-[14%] left-0 z-20 w-[9rem] rounded-[0.9rem] border border-[var(--color-line)] bg-white p-3 shadow-[0_18px_38px_rgba(5,20,128,0.14)] sm:left-1">
        <Headphones className="size-4 text-[var(--color-brand-blue)]" />
        <p className="mt-2 text-[0.55rem] text-[var(--color-text-muted)]">Daily formation</p>
        <p className="mt-1 font-[var(--font-sen)] text-[0.68rem] font-semibold leading-[1.1] text-[var(--color-text-strong)]">Prayer Watch + Podcast</p>
      </div>
    </div>
  );
}
