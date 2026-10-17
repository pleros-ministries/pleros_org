import Link from "next/link";
import type { ReactNode } from "react";
import { UserPlusIcon } from "lucide-react";

import type { GroupArt } from "../community-home-v3";

const fields: Record<GroupArt, { color: string; ink: string }> = {
  location: { color: "#cfe6fb", ink: "#0e3f73" },
  leading: { color: "#e3d8f8", ink: "#3e1876" },
  discipleship: { color: "#f6e4ac", ink: "#5a4508" },
  public: { color: "#f9caa7", ink: "#6b3410" },
  private: { color: "#f6d9de", ink: "#5e2236" },
};

/**
 * Top of every group page (the shell header carries "← Group"): the
 * group's illustrated card as a hero, and its actions. Shares the art and colours of the Groups cards.
 */
export function GroupHero({
  art,
  colourway,
  tag,
  title,
  meta,
  actions,
}: {
  art: GroupArt;
  /** Second "You lead" colourway. */
  colourway?: "slate";
  tag: string;
  title: string;
  meta: ReactNode;
  actions?: ReactNode;
}) {
  const slate = art === "leading" && colourway === "slate";
  const field = slate ? { color: "#e6ecfc", ink: "#1f3260" } : fields[art];
  const file = slate ? "leading-slate" : art;
  return (
    <div className="grid gap-3">
      <header
        className="grid min-h-[132px] content-between gap-3 rounded-[16px] bg-cover bg-right-bottom bg-no-repeat p-3.5"
        style={{
          backgroundColor: field.color,
          color: field.ink,
          backgroundImage: `image-set(url("/assets/dashboard/community-groups/${file}-wide-480.webp") 1x, url("/assets/dashboard/community-groups/${file}-wide-960.webp") 2x)`,
        }}
      >
        <span className="inline-flex h-[22px] w-fit items-center rounded-full bg-white/60 px-2 text-[11.5px] font-medium">{tag}</span>
        <div className="grid max-w-[62%] gap-0.5">
          <h1 className="m-0 font-[family-name:var(--font-dashboard-heading)] text-[19px] font-medium leading-[25px] tracking-[-0.02em]">{title}</h1>
          <p className="m-0 text-[12px] leading-[16px] opacity-85">{meta}</p>
        </div>
      </header>
      {actions ? <div className="flex flex-wrap items-center justify-end gap-2">{actions}</div> : null}
    </div>
  );
}

/** "Add contact" from inside a group: save a private contact, then (optionally) send them a group invite. */
export function AddContactAction({ inviteGroupId }: { inviteGroupId?: number }) {
  return (
    <Link
      href={`/dashboard/community/contacts/new${inviteGroupId ? `?invite=${inviteGroupId}` : ""}`}
      className="inline-flex h-8 items-center gap-1.5 rounded-[10px] border border-[var(--dashboard-panel-edge,#e2e5ea)] bg-white px-3 text-[12.5px] font-medium text-[var(--color-community-ink)]"
    >
      <UserPlusIcon className="size-3.5" strokeWidth={2} /> Add contact
    </Link>
  );
}

/** Segmented section switch used inside group pages. */
export function GroupTabs<T extends string>({
  tabs,
  value,
  onChange,
}: {
  tabs: Array<{ key: T; label: string; count?: number }>;
  value: T;
  onChange: (key: T) => void;
}) {
  return (
    <div role="tablist" aria-label="Group sections" className="grid rounded-[10px] bg-[#eceef2] p-[3px]" style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}>
      {tabs.map((item) => {
        const active = value === item.key;
        return (
          <button
            key={item.key}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.key)}
            className={`inline-flex h-8 min-w-0 items-center justify-center gap-1.5 rounded-[7px] px-1 text-[13px] font-medium transition-colors ${
              active ? "bg-white text-[var(--color-community-ink)] shadow-[0_1px_2px_rgb(0_0_0/8%)]" : "text-[var(--color-community-muted)]"
            }`}
          >
            <span className="truncate">{item.label}</span>
            {item.count != null ? <span className="text-[11.5px] text-[var(--color-community-muted)]">{item.count}</span> : null}
          </button>
        );
      })}
    </div>
  );
}
