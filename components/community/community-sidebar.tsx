import Link from "next/link";
import { ClockIcon, MessagesSquareIcon, type LucideIcon } from "lucide-react";

import type { CommunitySidebar as SidebarData } from "@/lib/db/queries/community-posts";

function snippet(post: { title: string | null; body: string }) {
  return post.title || post.body.slice(0, 70) || "Untitled post";
}

/** Panel header in the dashboard language: tinted icon, Sen title, quiet count. */
function PanelHeader({ icon: Icon, title, count, tone }: { icon: LucideIcon; title: string; count: number; tone: "blue" | "amber" }) {
  return (
    <div className="flex items-center gap-2.5 border-b border-[var(--color-line,#e7e9ec)] px-3.5 py-3">
      <span
        className={`grid size-7 shrink-0 place-items-center rounded-full ${
          tone === "blue"
            ? "bg-[var(--status-blue-bg,#e4ebfd)] text-[var(--status-blue-text,#2331ae)]"
            : "bg-[var(--status-amber-bg,#f7e4cd)] text-[var(--status-amber-text,#92400e)]"
        }`}
      >
        <Icon className="size-3.5" strokeWidth={2} />
      </span>
      <h2 className="m-0 flex-1 font-[family-name:var(--font-dashboard-heading)] text-[15px] font-medium leading-[22px] text-[var(--color-community-ink)]">
        {title}
      </h2>
      {count > 0 ? <span className="text-[12px] font-medium text-[var(--color-community-muted)]">{count}</span> : null}
    </div>
  );
}

const panel = "overflow-hidden rounded-[10px] border border-[var(--dashboard-panel-edge,#e2e5ea)] bg-white";
const row = "block px-3.5 py-2.5 transition-colors hover:bg-[var(--color-community-canvas)]";
const rowTitle = "line-clamp-2 text-[13.5px] font-medium leading-[19px] text-[var(--color-community-ink)]";
const rowMeta = "mt-0.5 block text-[11.5px] leading-[15px] text-[var(--color-community-muted)]";

/**
 * The feed's side rail on desktop. Phones skip it: the feed above already
 * lists the latest posts, so it would only repeat them.
 */
export function CommunitySidebar({
  data,
  className = "",
}: {
  data: SidebarData;
  className?: string;
}) {
  return (
    <aside className={`hidden w-full min-w-0 lg:block ${className}`}>
      <div className="grid gap-3 lg:sticky lg:top-28">
        <section className={panel}>
          <PanelHeader icon={ClockIcon} title="Latest posts" count={data.latest.length} tone="blue" />
          {data.latest.length === 0 ? (
            <p className="m-0 px-3.5 py-3 text-[13px] text-[var(--color-community-muted)]">Nothing yet.</p>
          ) : (
            <ul className="m-0 list-none divide-y divide-[var(--color-line,#e7e9ec)] p-0">
              {data.latest.map((post) => (
                <li key={post.id}>
                  <Link href={`/dashboard/community/post/${post.id}`} className={row}>
                    <span className={rowTitle}>{snippet(post)}</span>
                    <span className={rowMeta}>{post.authorName}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className={panel}>
          <PanelHeader icon={MessagesSquareIcon} title="Active discussions" count={data.active.length} tone="amber" />
          {data.active.length === 0 ? (
            <p className="m-0 px-3.5 py-3 text-[13px] text-[var(--color-community-muted)]">
              No discussions yet. Comment on a post to start one.
            </p>
          ) : (
            <ul className="m-0 list-none divide-y divide-[var(--color-line,#e7e9ec)] p-0">
              {data.active.map((post) => (
                <li key={post.id}>
                  <Link href={`/dashboard/community/post/${post.id}`} className={`${row} flex items-start gap-3`}>
                    <span className="min-w-0 flex-1">
                      <span className={rowTitle}>{snippet(post)}</span>
                      <span className={rowMeta}>{post.authorName}</span>
                    </span>
                    <span
                      aria-label={`${post.commentCount} comment${post.commentCount === 1 ? "" : "s"}`}
                      className="mt-0.5 inline-flex h-5 shrink-0 items-center gap-1 rounded-full bg-[var(--color-community-canvas)] px-1.5 text-[11.5px] font-medium text-[var(--color-community-muted)]"
                    >
                      <MessagesSquareIcon className="size-3" strokeWidth={2} />
                      {post.commentCount}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </aside>
  );
}
