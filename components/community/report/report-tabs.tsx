import Link from "next/link";

const TABS = [
  { key: "report", label: "Report", href: "/dashboard/community/report" },
  {
    key: "people",
    label: "People I met",
    href: "/dashboard/community/report/people",
  },
] as const;

/** The two halves of the daily report area: the day's report, and everyone met. */
export function ReportTabs({ active }: { active: (typeof TABS)[number]["key"] }) {
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
