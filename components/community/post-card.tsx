"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  CopyIcon,
  MessageCircleIcon,
  PinIcon,
  Repeat2Icon,
  SendIcon,
  Share2Icon,
  ThumbsUpIcon,
} from "lucide-react";
import { Popover } from "@base-ui/react/popover";

import type { FeedPost, PostImage } from "@/lib/db/queries/community-posts";
import type { PostComment } from "@/lib/db/queries/community-comments";
import {
  commentOnPost,
  loadComments,
  moderateComment,
  moderatePost,
  reportContent,
  sharePostToFeed,
  toggleCommentLike,
  toggleCommunityReaction,
} from "@/app/(site)/dashboard/community/_actions/feed-actions";
import { togglePostPinned } from "@/app/admin/_actions/community-actions";

import { ImageLightbox } from "./image-lightbox";

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const diff = Date.now() - then;
  const min = Math.round(diff / 60_000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h`;
  const day = Math.round(hr / 24);
  if (day < 7) return `${day}d`;
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    timeZone: "Africa/Lagos",
  }).format(new Date(iso));
}

function ImageGrid({
  images,
  onOpen,
}: {
  images: PostImage[];
  onOpen: (src: string) => void;
}) {
  if (images.length === 0) return null;
  return (
    <div
      className={`grid gap-1 overflow-hidden rounded-sm ${
        images.length === 1 ? "grid-cols-1" : "grid-cols-2"
      }`}
    >
      {images.map((img, i) => (
        <button
          key={img.key}
          type="button"
          onClick={() => onOpen(img.url)}
          className={`relative block ${
            images.length === 3 && i === 0 ? "col-span-2" : ""
          }`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={img.url}
            alt=""
            loading="lazy"
            className="h-full max-h-80 w-full object-cover"
          />
        </button>
      ))}
    </div>
  );
}

function QuotedPost({ post }: { post: NonNullable<FeedPost["sharedFrom"]> }) {
  return (
    <Link
      href={`/dashboard/community/post/${post.id}`}
      className="block rounded-sm border border-zinc-200 bg-zinc-50 p-3 transition-colors hover:border-zinc-300"
    >
      <p className="text-[0.65rem] font-semibold uppercase tracking-[0.08em] text-zinc-400">
        {post.authorName}
      </p>
      <p className="mt-1 line-clamp-4 whitespace-pre-line text-xs leading-[1.6] text-zinc-600">
        {post.body}
      </p>
      {post.images.length > 0 ? (
        <p className="mt-1 text-[0.65rem] text-zinc-400">
          {post.images.length} photo{post.images.length === 1 ? "" : "s"}
        </p>
      ) : null}
    </Link>
  );
}

export function PostCard({
  post,
  viewerUnitName,
  isAdmin,
  startExpanded = false,
}: {
  post: FeedPost;
  viewerUnitName: string | null;
  isAdmin: boolean;
  startExpanded?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [showComments, setShowComments] = useState(startExpanded);

  const [reacted, setReacted] = useState(post.reactedByMe);
  const [reactionCount, setReactionCount] = useState(post.reactionCount);

  function refresh() {
    startTransition(() => router.refresh());
  }

  function like() {
    setReacted((v) => !v);
    setReactionCount((n) => n + (reacted ? -1 : 1));
    startTransition(async () => {
      try {
        await toggleCommunityReaction(post.id);
      } finally {
        router.refresh();
      }
    });
  }

  const scopeLabel =
    post.scope === "unit" ? post.unitName ?? "Unit" : "Community";

  return (
    <article className="grid gap-2 rounded-sm border border-zinc-200 bg-white p-4">
      <div className="flex flex-wrap items-center gap-2 text-[0.65rem] font-semibold uppercase tracking-[0.08em] text-zinc-400">
        {post.pinned ? (
          <PinIcon className="size-3 text-[var(--color-brand-blue)]" />
        ) : null}
        <span className="text-zinc-600">{post.authorName}</span>
        <span>· {scopeLabel}</span>
        <span className="font-normal normal-case tracking-normal">
          · {relativeTime(post.lastActivityAt)}
        </span>
      </div>

      {post.title ? (
        <h2 className="ppc-heading text-sm font-semibold text-zinc-900">
          {post.title}
        </h2>
      ) : null}

      {post.body ? (
        <p className="whitespace-pre-line text-sm leading-[1.6] text-zinc-700">
          {post.body}
        </p>
      ) : null}

      <ImageGrid images={post.images} onOpen={setLightbox} />

      {post.sharedFrom ? <QuotedPost post={post.sharedFrom} /> : null}

      <div className="mt-1 flex items-center justify-between border-t border-zinc-100 pt-2 text-xs text-zinc-500">
        <span>
          {reactionCount > 0
            ? `${reactionCount} like${reactionCount === 1 ? "" : "s"}`
            : ""}
        </span>
        <span className="flex gap-3">
          {post.commentCount > 0 ? (
            <span>
              {post.commentCount} comment{post.commentCount === 1 ? "" : "s"}
            </span>
          ) : null}
          {post.shareCount > 0 ? (
            <span>
              {post.shareCount} share{post.shareCount === 1 ? "" : "s"}
            </span>
          ) : null}
        </span>
      </div>

      <div className="flex items-center gap-1 border-t border-zinc-100 pt-1">
        <button
          type="button"
          disabled={pending}
          onClick={like}
          aria-pressed={reacted}
          className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-sm py-1.5 text-xs font-medium transition-colors ${
            reacted
              ? "text-[var(--color-brand-blue)]"
              : "text-zinc-600 hover:bg-zinc-50"
          }`}
        >
          <ThumbsUpIcon className="size-4" strokeWidth={2} /> Like
        </button>
        <button
          type="button"
          onClick={() => setShowComments((v) => !v)}
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-sm py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-50"
        >
          <MessageCircleIcon className="size-4" strokeWidth={2} /> Comment
        </button>
        <ShareMenu
          post={post}
          viewerUnitName={viewerUnitName}
          onShared={refresh}
        />
      </div>

      <div className="flex items-center gap-3 text-[0.7rem] text-zinc-400">
        {post.canManage ? (
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                await moderatePost({ postId: post.id, action: "hide" }).catch(
                  () => {},
                );
                router.refresh();
              })
            }
            className="underline underline-offset-2"
          >
            Hide
          </button>
        ) : null}
        {isAdmin ? (
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                await togglePostPinned({
                  postId: post.id,
                  pinned: !post.pinned,
                }).catch(() => {});
                router.refresh();
              })
            }
            className="underline underline-offset-2"
          >
            {post.pinned ? "Unpin" : "Pin"}
          </button>
        ) : null}
        {!post.isMine ? (
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                await reportContent({
                  targetType: "post",
                  targetId: post.id,
                  reason: "Reported from feed",
                }).catch(() => {});
              })
            }
            className="underline underline-offset-2"
          >
            Report
          </button>
        ) : null}
      </div>

      {showComments ? <CommentThread postId={post.id} isAdmin={isAdmin} /> : null}

      {lightbox ? (
        <ImageLightbox
          src={lightbox}
          alt="Post image"
          onClose={() => setLightbox(null)}
        />
      ) : null}
    </article>
  );
}

function ShareMenu({
  post,
  viewerUnitName,
  onShared,
}: {
  post: FeedPost;
  viewerUnitName: string | null;
  onShared: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [mode, setMode] = useState<"menu" | "repost">("menu");
  const [note, setNote] = useState("");
  const [scope, setScope] = useState<"global" | "unit">("global");
  const [copied, setCopied] = useState(false);

  const link =
    typeof window !== "undefined"
      ? `${window.location.origin}/dashboard/community/post/${post.id}`
      : `/dashboard/community/post/${post.id}`;
  const text = post.title ?? post.body.slice(0, 120);

  function copy() {
    navigator.clipboard?.writeText(link).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      },
      () => {},
    );
  }

  return (
    <Popover.Root
      onOpenChange={(open) => {
        if (!open) {
          setMode("menu");
          setNote("");
        }
      }}
    >
      <Popover.Trigger className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-sm py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-50">
        <Share2Icon className="size-4" strokeWidth={2} /> Share
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner sideOffset={8} align="end">
          <Popover.Popup className="z-50 w-60 rounded-sm border border-zinc-200 bg-white p-2 text-xs shadow-lg outline-none">
            {mode === "menu" ? (
              <div className="grid gap-1">
                <button
                  type="button"
                  onClick={() => setMode("repost")}
                  className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-left text-zinc-700 hover:bg-zinc-50"
                >
                  <Repeat2Icon className="size-4" strokeWidth={2} /> Share to feed
                </button>
                <button
                  type="button"
                  onClick={copy}
                  className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-left text-zinc-700 hover:bg-zinc-50"
                >
                  <CopyIcon className="size-4" strokeWidth={2} />
                  {copied ? "Link copied" : "Copy link"}
                </button>
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(`${text} ${link}`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-left text-zinc-700 hover:bg-zinc-50"
                >
                  <SendIcon className="size-4" strokeWidth={2} /> WhatsApp
                </a>
                <a
                  href={`https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(text)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-left text-zinc-700 hover:bg-zinc-50"
                >
                  <SendIcon className="size-4" strokeWidth={2} /> Telegram
                </a>
              </div>
            ) : (
              <form
                className="grid gap-2"
                action={() => {
                  startTransition(async () => {
                    await sharePostToFeed({
                      sourcePostId: post.sharedFrom?.id ?? post.id,
                      scope,
                      note,
                    }).catch(() => {});
                    setNote("");
                    setMode("menu");
                    onShared();
                  });
                }}
              >
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Say something about this…"
                  rows={3}
                  className="rounded-sm border border-zinc-200 p-2 text-xs"
                />
                {viewerUnitName ? (
                  <select
                    value={scope}
                    onChange={(e) =>
                      setScope(e.target.value as "global" | "unit")
                    }
                    className="h-8 rounded-sm border border-zinc-200 px-1 text-xs"
                  >
                    <option value="global">To the community</option>
                    <option value="unit">To {viewerUnitName}</option>
                  </select>
                ) : null}
                <button
                  type="submit"
                  disabled={pending}
                  className="inline-flex h-8 items-center justify-center rounded-sm bg-[var(--color-brand-blue)] px-3 text-xs font-semibold text-white disabled:opacity-50"
                >
                  {pending ? "Sharing…" : "Share"}
                </button>
              </form>
            )}
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}

export function CommentThread({
  postId,
  isAdmin,
}: {
  postId: number;
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [comments, setComments] = useState<PostComment[] | null>(null);
  const [pending, startTransition] = useTransition();
  const [body, setBody] = useState("");
  const [replyTo, setReplyTo] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const loadedFor = useRef<number | null>(null);

  const reload = useCallback(() => {
    loadComments(postId)
      .then((rows) => setComments(rows))
      .catch(() => setComments([]));
  }, [postId]);

  useEffect(() => {
    if (loadedFor.current === postId) return;
    loadedFor.current = postId;
    const timer = window.setTimeout(reload, 0);
    return () => window.clearTimeout(timer);
  }, [postId, reload]);

  function submit() {
    const text = body.trim();
    if (!text) return;
    const parent = replyTo;
    setBody("");
    setReplyTo(null);
    setError(null);
    startTransition(async () => {
      try {
        await commentOnPost({ postId, body: text, replyToId: parent });
        reload();
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not comment.");
      }
    });
  }

  function act(run: () => Promise<unknown>) {
    startTransition(async () => {
      await run().catch(() => {});
      reload();
      router.refresh();
    });
  }

  const topLevel = (comments ?? []).filter((c) => c.replyToId == null);
  const repliesByParent = new Map<number, PostComment[]>();
  for (const c of comments ?? []) {
    if (c.replyToId != null) {
      repliesByParent.set(c.replyToId, [
        ...(repliesByParent.get(c.replyToId) ?? []),
        c,
      ]);
    }
  }

  return (
    <div className="grid gap-2 border-t border-zinc-100 pt-3">
      <form
        className="grid gap-1.5"
        action={() => submit()}
      >
        {replyTo != null ? (
          <p className="text-[0.7rem] text-zinc-500">
            Replying ·{" "}
            <button
              type="button"
              onClick={() => setReplyTo(null)}
              className="underline underline-offset-2"
            >
              cancel
            </button>
          </p>
        ) : null}
        <div className="flex items-start gap-2">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write a comment…"
            rows={1}
            className="min-h-8 flex-1 rounded-sm border border-zinc-200 p-2 text-xs"
          />
          <button
            type="submit"
            disabled={pending}
            className="inline-flex h-8 items-center rounded-sm bg-[var(--color-brand-blue)] px-3 text-xs font-semibold text-white disabled:opacity-50"
          >
            Post
          </button>
        </div>
        {error ? <p className="text-[0.7rem] text-red-700">{error}</p> : null}
      </form>

      {comments == null ? (
        <p className="text-[0.7rem] text-zinc-400">Loading comments…</p>
      ) : comments.length === 0 ? (
        <p className="text-[0.7rem] text-zinc-400">
          No comments yet. Be the first.
        </p>
      ) : (
        <ul className="grid gap-2">
          {topLevel.map((comment) => (
            <li key={comment.id} className="grid gap-2">
              <CommentRow
                comment={comment}
                isAdmin={isAdmin}
                pending={pending}
                onReply={() => setReplyTo(comment.id)}
                onLike={() => act(() => toggleCommentLike(comment.id))}
                onReport={() =>
                  act(() =>
                    reportContent({
                      targetType: "comment",
                      targetId: comment.id,
                      reason: "Reported from feed",
                    }),
                  )
                }
                onModerate={(action) =>
                  act(() => moderateComment({ commentId: comment.id, action }))
                }
              />
              {(repliesByParent.get(comment.id) ?? []).map((reply) => (
                <div key={reply.id} className="ml-5">
                  <CommentRow
                    comment={reply}
                    isAdmin={isAdmin}
                    pending={pending}
                    onLike={() => act(() => toggleCommentLike(reply.id))}
                    onReport={() =>
                      act(() =>
                        reportContent({
                          targetType: "comment",
                          targetId: reply.id,
                          reason: "Reported from feed",
                        }),
                      )
                    }
                    onModerate={(action) =>
                      act(() =>
                        moderateComment({ commentId: reply.id, action }),
                      )
                    }
                  />
                </div>
              ))}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function CommentRow({
  comment,
  isAdmin,
  pending,
  onReply,
  onLike,
  onReport,
  onModerate,
}: {
  comment: PostComment;
  isAdmin: boolean;
  pending: boolean;
  onReply?: () => void;
  onLike: () => void;
  onReport: () => void;
  onModerate: (action: "hide" | "restore") => void;
}) {
  return (
    <div className="rounded-sm bg-zinc-50 p-2.5">
      <div className="flex items-center justify-between gap-2 text-[0.65rem] font-semibold uppercase tracking-[0.08em] text-zinc-400">
        <span className="text-zinc-600">{comment.authorName}</span>
        <span className="font-normal normal-case tracking-normal">
          {new Intl.DateTimeFormat("en-GB", {
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
            timeZone: "Africa/Lagos",
          }).format(new Date(comment.createdAt))}
        </span>
      </div>
      {comment.body == null ? (
        <p className="mt-1 text-xs italic text-zinc-400">
          This comment was hidden.
        </p>
      ) : (
        <p className="mt-1 whitespace-pre-line text-xs leading-[1.6] text-zinc-700">
          {comment.body}
        </p>
      )}
      <div className="mt-1 flex flex-wrap items-center gap-3 text-[0.7rem]">
        <button
          type="button"
          disabled={pending}
          onClick={onLike}
          aria-pressed={comment.reactedByMe}
          className={
            comment.reactedByMe
              ? "font-semibold text-[var(--color-brand-blue)]"
              : "text-zinc-500 underline underline-offset-2"
          }
        >
          Like{comment.reactionCount > 0 ? ` (${comment.reactionCount})` : ""}
        </button>
        {onReply ? (
          <button
            type="button"
            onClick={onReply}
            className="text-zinc-500 underline underline-offset-2"
          >
            Reply
          </button>
        ) : null}
        {!comment.isMine && comment.body != null ? (
          <button
            type="button"
            disabled={pending}
            onClick={onReport}
            className="text-zinc-400 underline underline-offset-2"
          >
            Report
          </button>
        ) : null}
        {(comment.canModerate || isAdmin) && comment.body != null ? (
          <button
            type="button"
            disabled={pending}
            onClick={() => onModerate("hide")}
            className="text-red-700 underline underline-offset-2"
          >
            Hide
          </button>
        ) : null}
        {(comment.canModerate || isAdmin) && comment.body == null ? (
          <button
            type="button"
            disabled={pending}
            onClick={() => onModerate("restore")}
            className="text-[var(--color-brand-blue)] underline underline-offset-2"
          >
            Restore
          </button>
        ) : null}
      </div>
    </div>
  );
}
