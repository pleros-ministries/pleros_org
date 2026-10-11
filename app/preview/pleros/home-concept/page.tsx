import { GiftIcon, BookOpenIcon, HeadphonesIcon, SunriseIcon, GraduationCapIcon, LayersIcon, UsersIcon, HeartHandshakeIcon, ChevronRightIcon } from "lucide-react";
import { welcomeDashboardSections } from "@/lib/welcome-dashboard-content";
import { PageHeader } from "@/components/preview/pleros/ui";

const icons = {
  "welcome-pack": GiftIcon,
  "pre-sogp": BookOpenIcon,
  podcast: HeadphonesIcon,
  devotion: SunriseIcon,
  sogp: GraduationCapIcon,
  "advanced-sogp": LayersIcon,
  community: UsersIcon,
  partnership: HeartHandshakeIcon,
};
const metadata: Record<string, string> = {
  "welcome-pack": "Orientation · gifts · reminders",
  "pre-sogp": "Daily preparation",
  podcast: "Your listening journey",
  devotion: "Bible reading · Prayer Watch",
  sogp: "Your current course",
  "advanced-sogp": "",
  community: "Groups · messages",
  partnership: "Support the ministry",
};

/** Visual proposal only; the production home resolver and route stay intact. */
export default function HomeCardConcept() {
  return (
    <div className="grid gap-5">
      <PageHeader eyebrow="Home card concept" title="Your Pleros dashboard" />
      <div className="grid gap-x-6 gap-y-5 xl:grid-cols-2">
        {welcomeDashboardSections.map((section) => (
          <section key={section.id} aria-label={section.title} className="grid gap-2.5">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.1em] text-(--color-brand-blue)">{section.title}</h2>
            <div className="grid grid-cols-2 gap-3">
              {section.cards.map((card) => {
                const Icon = icons[card.id as keyof typeof icons] ?? card.icon;
                return (
                  <article key={card.id} className="relative flex min-h-[132px] flex-col gap-3 rounded-[var(--radius-lg)] border border-(--color-line-strong) bg-white p-3.5">
                    <div className="flex items-start justify-between gap-2">
                      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-(--color-brand-sky-soft) text-(--color-brand-blue)"><Icon className="size-[19px]" strokeWidth={1.75} aria-hidden /></span>
                      {card.status === "coming_soon" ? <span className="text-[10px] text-(--color-text-muted)">Soon</span> : null}
                    </div>
                    <div className="mt-auto grid gap-1 pr-4">
                      <h3 className="text-[14px] font-medium leading-snug text-(--color-text-strong)">{card.title}</h3>
                      <p aria-hidden={!metadata[card.id]} className="min-h-4 text-[11.5px] leading-snug text-(--color-text-muted)">{metadata[card.id]}</p>
                    </div>
                    {card.status !== "coming_soon" ? <ChevronRightIcon className="absolute bottom-3.5 right-3 size-3.5 text-(--color-text-muted)" aria-hidden /> : null}
                  </article>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
