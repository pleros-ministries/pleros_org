import Link from "next/link";
import { MessageCircleIcon } from "lucide-react";

import type { CommunitySidebar as SidebarData } from "@/lib/db/queries/community-posts";

function snippet(post: { title: string | null; body: string }) {
  return post.title || post.body.slice(0, 70) || "Untitled post";
}

const card =
  "rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-[0_1px_3px_rgba(24,24,27,0.06)]";

export function CommunitySidebar({
  data,
  unit,
}: {
  data: SidebarData;
  unit: { id: number; name: string } | null;
}) {
  return (
    <aside className="hidden lg:block">
      <div className="sticky top-16 grid gap-4">
        {unit ? (
          <Link
            href={`/dashboard/community/unit/${unit.id}`}
            className={`${card} block transition-colors hover:border-zinc-300`}
          >
            <p className="text-xs font-medium text-zinc-500">Your unit</p>
            <p className="mt-1 text-sm font-semibold text-zinc-900">
              {unit.name}
            </p>
          </Link>
        ) : null}

        <section className={card}>
          <h2 className="text-sm font-semibold text-zinc-900">Latest posts</h2>
          {data.latest.length === 0 ? (
            <p className="mt-2 text-sm text-zinc-400">Nothing yet.</p>
          ) : (
            <ul className="mt-3 grid gap-3">
              {data.latest.map((post) => (
                <li key={post.id}>
                  <Link
                    href={`/dashboard/community/post/${post.id}`}
                    className="block text-sm leading-snug text-zinc-700 hover:text-[var(--color-brand-blue)]"
                  >
                    <span className="line-clamp-2">{snippet(post)}</span>
                    <span className="text-xs text-zinc-400">
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
          <h2 className="text-sm font-semibold text-zinc-900">
            Active discussions
          </h2>
          {data.active.length === 0 ? (
            <p className="mt-2 text-sm text-zinc-400">
              No discussions yet. Comment on a post to start one.
            </p>
          ) : (
            <ul className="mt-3 grid gap-3">
              {data.active.map((post) => (
                <li key={post.id}>
                  <Link
                    href={`/dashboard/community/post/${post.id}`}
                    className="flex items-start gap-2 text-sm leading-snug text-zinc-700 hover:text-[var(--color-brand-blue)]"
                  >
                    <MessageCircleIcon
                      className="mt-0.5 size-3.5 shrink-0 text-zinc-400"
                      strokeWidth={2}
                    />
                    <span>
                      <span className="line-clamp-2">{snippet(post)}</span>
                      <span className="text-xs text-zinc-400">
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
