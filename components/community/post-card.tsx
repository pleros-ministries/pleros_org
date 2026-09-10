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

import { Avatar } from "./avatar";
import { ImageLightbox } from "./image-lightbox";

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
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
      className={`grid gap-1 overflow-hidden rounded-xl ${
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
            className="h-full max-h-[28rem] w-full object-cover"
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
      className="mt-1 block rounded-xl border border-zinc-200 bg-zinc-50/70 p-3 transition-colors hover:bg-zinc-100/70"
    >
      <div className="flex items-center gap-2">
        <Avatar name={post.authorName} size={24} />
        <p className="text-xs font-semibold text-zinc-700">{post.authorName}</p>
      </div>
      <p className="mt-1.5 line-clamp-4 whitespace-pre-line text-sm leading-relaxed text-zinc-600">
        {post.body}
      </p>
      {post.images.length > 0 ? (
        <p className="mt-1 text-xs text-zinc-400">
          {post.images.length} photo{post.images.length === 1 ? "" : "s"}
        </p>
      ) : null}
    </Link>
  );
}

export function PostCard({
  post,
  viewerName = "You",
  viewerUnitName,
  isAdmin,
  startExpanded = false,
}: {
  post: FeedPost;
  viewerName?: string;
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

  const actionButton =
    "flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium transition-colors";

  return (
    <article className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-[0_1px_3px_rgba(24,24,27,0.06)]">
      <div className="grid gap-3 p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <Avatar name={post.authorName} size={40} />
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1.5 text-sm font-semibold text-zinc-900">
              {post.authorName}
              {post.pinned ? (
                <PinIcon
                  className="size-3.5 text-[var(--color-brand-blue)]"
                  strokeWidth={2}
                />
              ) : null}
            </p>
            <p className="text-xs text-zinc-500">
              {scopeLabel} · {relativeTime(post.lastActivityAt)}
            </p>
          </div>
        </div>

        {post.title ? (
          <h2 className="ppc-heading text-base font-semibold text-zinc-900">
            {post.title}
          </h2>
        ) : null}

        {post.body ? (
          <p className="whitespace-pre-line text-[15px] leading-relaxed text-zinc-800">
            {post.body}
          </p>
        ) : null}

        <ImageGrid images={post.images} onOpen={setLightbox} />

        {post.sharedFrom ? <QuotedPost post={post.sharedFrom} /> : null}

        {reactionCount > 0 || post.commentCount > 0 || post.shareCount > 0 ? (
          <div className="flex items-center justify-between text-xs text-zinc-500">
            <span className="flex items-center gap-1.5">
              {reactionCount > 0 ? (
                <>
                  <span className="inline-flex size-4 items-center justify-center rounded-full bg-[var(--color-brand-blue)] text-white">
                    <ThumbsUpIcon className="size-2.5" strokeWidth={2.5} />
                  </span>
                  {reactionCount}
                </>
              ) : null}
            </span>
            <span className="flex gap-3">
              {post.commentCount > 0 ? (
                <button
                  type="button"
                  onClick={() => setShowComments(true)}
                  className="hover:underline"
                >
                  {post.commentCount} comment{post.commentCount === 1 ? "" : "s"}
                </button>
              ) : null}
              {post.shareCount > 0 ? (
                <span>
                  {post.shareCount} share{post.shareCount === 1 ? "" : "s"}
                </span>
              ) : null}
            </span>
          </div>
        ) : null}
      </div>

      <div className="mx-3 flex items-center gap-1 border-t border-zinc-100 py-1">
        <button
          type="button"
          disabled={pending}
          onClick={like}
          aria-pressed={reacted}
          className={`${actionButton} ${
            reacted
              ? "text-[var(--color-brand-blue)]"
              : "text-zinc-600 hover:bg-zinc-50"
          }`}
        >
          <ThumbsUpIcon
            className="size-[18px]"
            strokeWidth={reacted ? 2.5 : 2}
            fill={reacted ? "currentColor" : "none"}
          />
          Like
        </button>
        <button
          type="button"
          onClick={() => setShowComments((v) => !v)}
          className={`${actionButton} text-zinc-600 hover:bg-zinc-50`}
        >
          <MessageCircleIcon className="size-[18px]" strokeWidth={2} />
          Comment
        </button>
        <ShareMenu
          post={post}
          viewerUnitName={viewerUnitName}
          onShared={refresh}
          className={`${actionButton} text-zinc-600 hover:bg-zinc-50`}
        />
      </div>

      {post.canManage || isAdmin || !post.isMine ? (
        <div className="flex items-center gap-4 px-4 pb-2 text-[0.7rem] text-zinc-400 sm:px-5">
          {post.canManage ? (
            <button
              type="button"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  await moderatePost({
                    postId: post.id,
                    action: "hide",
                  }).catch(() => {});
                  router.refresh();
                })
              }
              className="hover:text-zinc-600 hover:underline"
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
              className="hover:text-zinc-600 hover:underline"
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
              className="hover:text-zinc-600 hover:underline"
            >
              Report
            </button>
          ) : null}
        </div>
      ) : null}

      {showComments ? (
        <div className="border-t border-zinc-100 bg-zinc-50/50 px-4 py-4 sm:px-5">
          <CommentThread
            postId={post.id}
            viewerName={viewerName}
            isAdmin={isAdmin}
          />
        </div>
      ) : null}

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
  className = "",
}: {
  post: FeedPost;
  viewerUnitName: string | null;
  onShared: () => void;
  className?: string;
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

  const menuItem =
    "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-zinc-700 transition-colors hover:bg-zinc-50";

  return (
    <Popover.Root
      onOpenChange={(open) => {
        if (!open) {
          setMode("menu");
          setNote("");
        }
      }}
    >
      <Popover.Trigger className={className}>
        <Share2Icon className="size-[18px]" strokeWidth={2} /> Share
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner sideOffset={8} align="end">
          <Popover.Popup className="z-50 w-64 rounded-xl border border-zinc-200 bg-white p-1.5 text-sm shadow-lg outline-none">
            {mode === "menu" ? (
              <div className="grid gap-0.5">
                <button
                  type="button"
                  onClick={() => setMode("repost")}
                  className={menuItem}
                >
                  <Repeat2Icon className="size-4 text-zinc-400" strokeWidth={2} />
                  Share to feed
                </button>
                <button type="button" onClick={copy} className={menuItem}>
                  <CopyIcon className="size-4 text-zinc-400" strokeWidth={2} />
                  {copied ? "Link copied" : "Copy link"}
                </button>
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(`${text} ${link}`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className={menuItem}
                >
                  <SendIcon className="size-4 text-zinc-400" strokeWidth={2} />
                  WhatsApp
                </a>
                <a
                  href={`https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(text)}`}
                  target="_blank"
                  rel="noreferrer"
                  className={menuItem}
                >
                  <SendIcon className="size-4 text-zinc-400" strokeWidth={2} />
                  Telegram
                </a>
              </div>
            ) : (
              <form
                className="grid gap-2 p-1"
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
                  className="rounded-lg border border-zinc-200 p-2 text-sm"
                />
                {viewerUnitName ? (
                  <select
                    value={scope}
                    onChange={(e) =>
                      setScope(e.target.value as "global" | "unit")
                    }
                    className="h-9 rounded-lg border border-zinc-200 px-2 text-sm"
                  >
                    <option value="global">To the community</option>
                    <option value="unit">To {viewerUnitName}</option>
                  </select>
                ) : null}
                <button
                  type="submit"
                  disabled={pending}
                  className="inline-flex h-9 items-center justify-center rounded-lg bg-[var(--color-brand-blue)] px-3 text-sm font-semibold text-white disabled:opacity-50"
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
  viewerName = "You",
  isAdmin,
}: {
  postId: number;
  viewerName?: string;
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
    <div className="grid gap-3">
      <form className="flex items-start gap-2" action={() => submit()}>
        <Avatar name={viewerName} size={32} className="mt-0.5" />
        <div className="min-w-0 flex-1">
          {replyTo != null ? (
            <p className="mb-1 text-xs text-zinc-500">
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
          <div className="flex items-end gap-2">
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write a comment…"
              rows={1}
              className="min-h-9 flex-1 resize-none rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-300"
            />
            <button
              type="submit"
              disabled={pending}
              className="inline-flex h-9 shrink-0 items-center rounded-full bg-[var(--color-brand-blue)] px-4 text-sm font-semibold text-white disabled:opacity-50"
            >
              Post
            </button>
          </div>
          {error ? (
            <p className="mt-1 text-xs text-red-700">{error}</p>
          ) : null}
        </div>
      </form>

      {comments == null ? (
        <p className="text-xs text-zinc-400">Loading comments…</p>
      ) : comments.length === 0 ? (
        <p className="text-xs text-zinc-400">No comments yet. Be the first.</p>
      ) : (
        <ul className="grid gap-3">
          {topLevel.map((comment) => (
            <li key={comment.id} className="grid gap-3">
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
                <div key={reply.id} className="ml-10">
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
  const canModerate = comment.canModerate || isAdmin;
  return (
    <div className="flex items-start gap-2">
      <Avatar name={comment.authorName} size={32} />
      <div className="min-w-0 flex-1">
        {comment.body == null ? (
          <p className="rounded-2xl bg-zinc-100 px-3 py-2 text-sm italic text-zinc-400">
            This comment was hidden.
          </p>
        ) : (
          <div className="inline-block max-w-full rounded-2xl bg-zinc-100 px-3 py-2">
            <p className="text-xs font-semibold text-zinc-900">
              {comment.authorName}
            </p>
            <p className="whitespace-pre-line break-words text-sm leading-relaxed text-zinc-800">
              {comment.body}
            </p>
          </div>
        )}
        <div className="mt-1 flex flex-wrap items-center gap-3 pl-3 text-xs text-zinc-500">
          <button
            type="button"
            disabled={pending}
            onClick={onLike}
            aria-pressed={comment.reactedByMe}
            className={
              comment.reactedByMe
                ? "font-semibold text-[var(--color-brand-blue)]"
                : "hover:underline"
            }
          >
            Like{comment.reactionCount > 0 ? ` (${comment.reactionCount})` : ""}
          </button>
          {onReply ? (
            <button
              type="button"
              onClick={onReply}
              className="hover:underline"
            >
              Reply
            </button>
          ) : null}
          <span className="text-zinc-400">{relativeTime(comment.createdAt)}</span>
          {!comment.isMine && comment.body != null ? (
            <button
              type="button"
              disabled={pending}
              onClick={onReport}
              className="text-zinc-400 hover:underline"
            >
              Report
            </button>
          ) : null}
          {canModerate && comment.body != null ? (
            <button
              type="button"
              disabled={pending}
              onClick={() => onModerate("hide")}
              className="text-red-700 hover:underline"
            >
              Hide
            </button>
          ) : null}
          {canModerate && comment.body == null ? (
            <button
              type="button"
              disabled={pending}
              onClick={() => onModerate("restore")}
              className="text-[var(--color-brand-blue)] hover:underline"
            >
              Restore
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
