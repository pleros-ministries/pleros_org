import Link from "next/link";
import { MessageCircleIcon } from "lucide-react";

import type { CommunitySidebar as SidebarData } from "@/lib/db/queries/community-posts";

function snippet(post: { title: string | null; body: string }) {
  return post.title || post.body.slice(0, 70) || "Untitled post";
}

const card =
  "rounded-2xl border border-[var(--color-community-edge)] bg-white p-5 ";

export function CommunitySidebar({
  data,
  className = "",
}: {
  data: SidebarData;
  className?: string;
}) {
  return (
    <aside className={className}>
      <div className="grid gap-4 lg:sticky lg:top-16">
        <section className={card}>
          <h2 className="text-sm font-semibold text-[var(--color-community-ink)]">Latest posts</h2>
          {data.latest.length === 0 ? (
            <p className="mt-2 text-sm text-[var(--color-community-muted)]">Nothing yet.</p>
          ) : (
            <ul className="mt-3 grid gap-3">
              {data.latest.map((post) => (
                <li key={post.id}>
                  <Link
                    href={`/dashboard/community/post/${post.id}`}
                    className="block text-sm leading-snug text-[var(--color-community-ink)] hover:text-[var(--color-community-blue)]"
                  >
                    <span className="line-clamp-2">{snippet(post)}</span>
                    <span className="text-xs text-[var(--color-community-muted)]">
                      {" "}
                      · {post.authorName}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className={card}>
          <h2 className="text-sm font-semibold text-[var(--color-community-ink)]">
            Active discussions
          </h2>
          {data.active.length === 0 ? (
            <p className="mt-2 text-sm text-[var(--color-community-muted)]">
              No discussions yet. Comment on a post to start one.
            </p>
          ) : (
            <ul className="mt-3 grid gap-3">
              {data.active.map((post) => (
                <li key={post.id}>
                  <Link
                    href={`/dashboard/community/post/${post.id}`}
                    className="flex items-start gap-2 text-sm leading-snug text-[var(--color-community-ink)] hover:text-[var(--color-community-blue)]"
                  >
                    <MessageCircleIcon
                      className="mt-0.5 size-3.5 shrink-0 text-[var(--color-community-muted)]"
                      strokeWidth={2}
                    />
                    <span>
                      <span className="line-clamp-2">{snippet(post)}</span>
                      <span className="text-xs text-[var(--color-community-muted)]">
                        {" "}
                        · {post.commentCount} comment
                        {post.commentCount === 1 ? "" : "s"}
                      </span>
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
