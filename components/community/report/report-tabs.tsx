import Link from "next/link";

const TABS = [
  { key: "report", label: "Report", href: "/dashboard/community/report" },
  { key: "people", label: "People", href: "/dashboard/community/report/people" },
  { key: "history", label: "History", href: "/dashboard/community/report/history" },
] as const;

export type ReportTab = (typeof TABS)[number]["key"];

/** The three parts of the daily report area: the day's activities, everyone met, and past days. */
export function ReportTabs({ active }: { active: ReportTab }) {
  return (
    <nav
      aria-label="Daily report sections"
      className="flex gap-5 border-b border-(--color-line-strong)"
    >
      {TABS.map((tab) => {
        const selected = tab.key === active;
        return (
          <Link
            key={tab.key}
            href={tab.href}
            aria-current={selected ? "page" : undefined}
            className={`-mb-px border-b-2 pb-2.5 text-sm font-medium transition-colors ${
              selected
                ? "border-(--color-brand-blue) text-(--color-brand-blue)"
                : "border-transparent text-zinc-500 hover:text-zinc-800"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
