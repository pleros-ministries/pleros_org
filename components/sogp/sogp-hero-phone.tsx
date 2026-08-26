import {
  BookOpen,
  GraduationCap,
  Headphones,
  House,
  MessageCircleMore,
  PenLine,
  Play,
  Radio,
  User,
  Users,
} from "lucide-react";

const navItems = [House, GraduationCap, Users, User] as const;

function StatusBar() {
  return (
    <div className="flex items-center justify-between px-4 pb-1 pt-2.5 text-[#07133f]">
      <span className="font-[var(--font-be-vietnam-pro)] text-[0.5rem] font-semibold tracking-tight">
        9:41
      </span>
      <span className="flex items-center gap-1">
        <span className="flex items-end gap-[1.5px]">
          <span className="block h-[3px] w-[2px] rounded-[1px] bg-current" />
          <span className="block h-[5px] w-[2px] rounded-[1px] bg-current" />
          <span className="block h-[7px] w-[2px] rounded-[1px] bg-current" />
          <span className="block h-[9px] w-[2px] rounded-[1px] bg-current opacity-30" />
        </span>
        <span className="relative block h-[7px] w-[13px] rounded-[2px] border border-current p-[1px]">
          <span className="block h-full w-[65%] rounded-[1px] bg-current" />
        </span>
      </span>
    </div>
  );
}

export function SogpHeroPhone() {
  return (
    <div
      aria-hidden="true"
      className="relative mx-auto w-full max-w-[26rem] py-4 lg:py-8"
    >
      {/* Aligned brand backdrop — squared up with the device rather than tilted against it. */}
      <div className="absolute left-1/2 top-1/2 h-[84%] w-[92%] -translate-x-1/2 -translate-y-1/2 rounded-[2.75rem] bg-gradient-to-b from-[var(--color-brand-sky)] to-[var(--color-brand-sky-soft)] sm:w-[86%]" />

      <div className="relative mx-auto w-[14.5rem] sm:w-[16rem]">
        <div className="relative overflow-hidden rounded-[2.5rem] border-[0.5rem] border-[#07133f] bg-[#07133f] shadow-[0_34px_70px_-24px_rgba(5,20,128,0.55)]">
          {/* Dynamic island */}
          <div className="absolute left-1/2 top-[0.55rem] z-20 h-[1.05rem] w-[3.9rem] -translate-x-1/2 rounded-full bg-[#07133f]" />

          <div className="flex aspect-[9/19] flex-col overflow-hidden rounded-[2.05rem] bg-[var(--color-surface-muted)]">
            <StatusBar />

            <div className="bg-white px-4 pb-3.5 pt-3">
              <p className="font-[var(--font-be-vietnam-pro)] text-[0.45rem] font-semibold uppercase tracking-[0.16em] text-[var(--color-brand-blue)]">
                School of God&apos;s Purpose
              </p>
              <p className="mt-1.5 font-[var(--font-sen)] text-[1.15rem] font-semibold leading-none tracking-[-0.05em] text-[var(--color-text-strong)]">
                Your journey
              </p>
              <div className="mt-3 flex items-baseline justify-between font-[var(--font-be-vietnam-pro)] text-[0.48rem] font-semibold">
                <span className="text-[var(--color-text-muted)]">
                  Day 08 of 24
                </span>
                <span className="text-[var(--color-brand-blue)]">33%</span>
              </div>
              <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-[var(--color-brand-sky)]">
                <div className="h-full w-[33%] rounded-full bg-[var(--color-brand-blue)]" />
              </div>
            </div>

            <div className="grid flex-1 content-start gap-2 px-3 py-3">
              <div className="rounded-[0.85rem] bg-[var(--color-brand-blue)] p-3 text-white">
                <div className="flex items-center gap-1.5 font-[var(--font-be-vietnam-pro)] text-[0.42rem] font-semibold uppercase tracking-[0.14em] text-[var(--color-brand-lime)]">
                  <BookOpen className="size-2.5" /> Today&apos;s track
                </div>
                <p className="mt-1.5 font-[var(--font-sen)] text-[0.8rem] font-semibold leading-[1.15] tracking-[-0.02em]">
                  The Life of Prayer
                </p>
                <div className="mt-2.5 flex items-center gap-1.5">
                  <span className="grid size-[1.15rem] place-items-center rounded-full bg-white text-[var(--color-brand-blue)]">
                    <Play className="size-2 fill-current" />
                  </span>
                  <span className="font-[var(--font-be-vietnam-pro)] text-[0.44rem] text-white/70">
                    Track 08 · 18 min
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-[0.7rem] border border-[var(--color-line)] bg-white p-2.5">
                  <p className="font-[var(--font-be-vietnam-pro)] text-[0.44rem] text-[var(--color-text-muted)]">
                    Streak
                  </p>
                  <p className="mt-0.5 font-[var(--font-sen)] text-[0.72rem] font-semibold text-[var(--color-brand-blue)]">
                    6 days
                  </p>
                </div>
                <div className="rounded-[0.7rem] border border-[var(--color-line)] bg-white p-2.5">
                  <p className="font-[var(--font-be-vietnam-pro)] text-[0.44rem] text-[var(--color-text-muted)]">
                    Formation
                  </p>
                  <p className="mt-0.5 font-[var(--font-sen)] text-[0.72rem] font-semibold text-[var(--color-brand-blue)]">
                    On track
                  </p>
                </div>
              </div>

              {[
                {
                  Icon: Radio,
                  title: "Saturday live class",
                  meta: "5:00 PM · Teaching and Q&A",
                },
                {
                  Icon: PenLine,
                  title: "Written reflection",
                  meta: "Track 07 · Awaiting your answer",
                },
              ].map(({ Icon, title, meta }) => (
                <div
                  key={title}
                  className="flex items-center gap-2 rounded-[0.7rem] border border-[var(--color-line)] bg-white p-2.5"
                >
                  <span className="grid size-[1.35rem] shrink-0 place-items-center rounded-full bg-[var(--color-brand-sky)]">
                    <Icon className="size-2.5 text-[var(--color-brand-blue)]" />
                  </span>
                  <span className="min-w-0">
                    <p className="font-[var(--font-be-vietnam-pro)] text-[0.52rem] font-semibold leading-tight text-[var(--color-text-strong)]">
                      {title}
                    </p>
                    <p className="font-[var(--font-be-vietnam-pro)] text-[0.44rem] leading-tight text-[var(--color-text-muted)]">
                      {meta}
                    </p>
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-auto border-t border-[var(--color-line)] bg-white px-4 pb-2 pt-2">
              <div className="flex items-center justify-between">
                {navItems.map((Icon, index) => (
                  <Icon
                    key={index}
                    className={
                      index === 0
                        ? "size-3 text-[var(--color-brand-blue)]"
                        : "size-3 text-[var(--color-text-muted)] opacity-45"
                    }
                  />
                ))}
              </div>
              <div className="mx-auto mt-2 h-[2.5px] w-[32%] rounded-full bg-[#07133f]/20" />
            </div>
          </div>
        </div>

        {/* Overlay cards sit clear of the screen content and only appear once
            there is room for them beside the device. */}
        <div className="absolute -right-12 top-[6%] hidden w-[8.75rem] rounded-[0.9rem] border border-[var(--color-line)] bg-white p-3 shadow-[0_18px_38px_rgba(5,20,128,0.16)] sm:block">
          <span className="grid size-6 place-items-center rounded-full bg-[var(--color-brand-sky)]">
            <MessageCircleMore className="size-3.5 text-[var(--color-brand-blue)]" />
          </span>
          <p className="mt-2 font-[var(--font-be-vietnam-pro)] text-[0.55rem] text-[var(--color-text-muted)]">
            Telegram community
          </p>
          <p className="mt-0.5 font-[var(--font-sen)] text-[0.7rem] font-semibold leading-[1.15] tracking-[-0.02em] text-[var(--color-text-strong)]">
            Updates and cohort connection
          </p>
        </div>

        <div className="absolute -left-12 bottom-[12%] hidden w-[8.75rem] rounded-[0.9rem] border border-[var(--color-line)] bg-white p-3 shadow-[0_18px_38px_rgba(5,20,128,0.16)] sm:block">
          <span className="grid size-6 place-items-center rounded-full bg-[var(--color-brand-sky)]">
            <Headphones className="size-3.5 text-[var(--color-brand-blue)]" />
          </span>
          <p className="mt-2 font-[var(--font-be-vietnam-pro)] text-[0.55rem] text-[var(--color-text-muted)]">
            Daily formation
          </p>
          <p className="mt-0.5 font-[var(--font-sen)] text-[0.7rem] font-semibold leading-[1.15] tracking-[-0.02em] text-[var(--color-text-strong)]">
            Prayer Watch and Podcast
          </p>
        </div>
      </div>
    </div>
  );
}
