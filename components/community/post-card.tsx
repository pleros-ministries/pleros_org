"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
  type QueryClient,
} from "@tanstack/react-query";
import {
  CopyIcon,
  EyeOffIcon,
  FlagIcon,
  MegaphoneIcon,
  MessageCircleIcon,
  PencilIcon,
  PinIcon,
  Repeat2Icon,
  SendIcon,
  Share2Icon,
  ThumbsUpIcon,
  Trash2Icon,
} from "lucide-react";
import { Popover } from "@base-ui/react/popover";

import type { FeedPost, PostImage } from "@/lib/db/queries/community-posts";
import type { PostComment } from "@/lib/db/queries/community-comments";
import type { FeedPage } from "@/lib/community/feed";
import { POST_BODY_MAX, POST_TITLE_MAX } from "@/lib/community/post-input";
import { communityKeys } from "@/lib/community/query-keys";
import { relativeTime } from "@/lib/community/time";
import { COMMUNITY_TOPICS, topicLabel } from "@/lib/community/topics";
import {
  commentOnPost,
  deleteOwnPost,
  editOwnPost,
  moderateComment,
  moderatePost,
  reportContent,
  sharePostToFeed,
  toggleCommentLike,
  toggleCommunityReaction,
  togglePostPin,
} from "@/app/(site)/dashboard/community/_actions/feed-actions";

import { ActionMenu, type MenuAction } from "./action-menu";
import { Avatar } from "./avatar";
import { ImageLightbox } from "./image-lightbox";
import { useOpenConversation } from "./messages/use-open-conversation";
import { PostBody } from "./post-body";
import { ReportDialog } from "./report-dialog";

function ImageGrid({
  images,
  onOpen,
}: {
  images: PostImage[];
  onOpen: (src: string) => void;
}) {
  if (images.length === 0) return null;
  const three = images.length === 3;
  return (
    <div
      className={`grid gap-1 overflow-hidden rounded-xl ${
        images.length === 1
          ? "grid-cols-1"
          : three
            ? "h-96 grid-cols-2 grid-rows-2"
            : "grid-cols-2"
      }`}
    >
      {images.map((img, i) => (
        <button
          key={img.key}
          type="button"
          onClick={() => onOpen(img.url)}
          className={`relative block ${three ? "h-full" : ""} ${
            three && i === 0 ? "row-span-2" : ""
          }`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={img.url}
            alt=""
            loading="lazy"
            className={`w-full object-cover ${
              three ? "h-full" : "h-full max-h-[28rem]"
            }`}
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

/** Applies `update` to one post in every open feed view (community or group, any sort). */
function patchPostInFeeds(
  queryClient: QueryClient,
  postId: number,
  update: (post: FeedPost) => FeedPost,
) {
  queryClient.setQueriesData<InfiniteData<FeedPage>>(
    { queryKey: communityKeys.feedRoot() },
    (old) =>
      old
        ? {
            ...old,
            pages: old.pages.map((pg) => ({
              ...pg,
              posts: pg.posts.map((p) => (p.id === postId ? update(p) : p)),
            })),
          }
        : old,
  );
}

/** Inline editor for the author's own post. Photos stay as posted. */
function PostEditForm({
  post,
  onDone,
}: {
  post: FeedPost;
  onDone: () => void;
}) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState(post.title ?? "");
  const [body, setBody] = useState(post.body);
  const [topic, setTopic] = useState(post.topic ?? "");
  const [error, setError] = useState<string | null>(null);
  const isDiscussion = post.kind === "discussion";

  const saveMutation = useMutation({
    mutationFn: async () => {
      const result = await editOwnPost({
        postId: post.id,
        title,
        body,
        topic: isDiscussion ? topic || null : null,
      });
      if (!result.ok) throw new Error(result.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: communityKeys.feedRoot() });
      onDone();
    },
    onError: (e) =>
      setError(e instanceof Error ? e.message : "Could not save your changes."),
  });

  const fieldClass =
    "w-full rounded-xl border border-zinc-200 px-3 text-base outline-none focus:border-zinc-300 sm:text-[15px]";

  return (
    <form
      className="grid gap-2"
      action={() => {
        setError(null);
        saveMutation.mutate();
      }}
    >
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder={isDiscussion ? "Title" : "Title (optional)"}
        aria-label="Title"
        maxLength={POST_TITLE_MAX}
        required={isDiscussion}
        className={`${fieldClass} h-11 font-medium`}
      />
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        aria-label="Post"
        rows={4}
        maxLength={POST_BODY_MAX}
        className={`${fieldClass} resize-none py-3 leading-relaxed`}
      />
      {error ? (
        <p role="alert" className="text-[13px] text-red-700">
          {error}
        </p>
      ) : null}
      <div className="flex flex-wrap items-center gap-2">
        {isDiscussion ? (
          <select
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            aria-label="Topic"
            className="h-9 rounded-lg border border-zinc-200 px-2 text-sm"
          >
            <option value="">No topic</option>
            {COMMUNITY_TOPICS.map((option) => (
              <option key={option.key} value={option.key}>
                {option.label}
              </option>
            ))}
          </select>
        ) : null}
        <div className="ml-auto flex items-center gap-3">
          <button
            type="button"
            onClick={onDone}
            className="text-sm text-zinc-500 hover:underline"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saveMutation.isPending}
            className="inline-flex h-9 items-center rounded-lg bg-[var(--color-brand-blue)] px-4 text-sm font-semibold text-white disabled:opacity-50"
          >
            {saveMutation.isPending ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </form>
  );
}

export function PostCard({
  post,
  viewerName = "You",
  viewerUnitName,
  canRepost = false,
  isAdmin,
  startExpanded = false,
}: {
  post: FeedPost;
  viewerName?: string;
  viewerUnitName: string | null;
  /** Leaders and admins can repost into the feed. */
  canRepost?: boolean;
  isAdmin: boolean;
  startExpanded?: boolean;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const chat = useOpenConversation();
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [showComments, setShowComments] = useState(startExpanded);
  const [editing, setEditing] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const reacted = post.reactedByMe;
  const reactionCount = post.reactionCount;
  const feedRoot = communityKeys.feedRoot();

  function invalidateFeed() {
    queryClient.invalidateQueries({ queryKey: feedRoot });
  }

  const reactionMutation = useMutation({
    mutationFn: () => toggleCommunityReaction(post.id),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: feedRoot });
      const prev = queryClient.getQueriesData<InfiniteData<FeedPage>>({
        queryKey: feedRoot,
      });
      patchPostInFeeds(queryClient, post.id, (p) => ({
        ...p,
        reactedByMe: !p.reactedByMe,
        reactionCount: p.reactionCount + (p.reactedByMe ? -1 : 1),
      }));
      return { prev };
    },
    onError: (_e, _v, context) => {
      for (const [key, data] of context?.prev ?? []) {
        queryClient.setQueryData(key, data);
      }
    },
    onSettled: invalidateFeed,
  });
  const moderateMutation = useMutation({
    mutationFn: (action: "hide" | "restore") =>
      moderatePost({ postId: post.id, action }),
    onSettled: invalidateFeed,
  });
  const pinMutation = useMutation({
    mutationFn: (pinned: boolean) => togglePostPin({ postId: post.id, pinned }),
    onSettled: invalidateFeed,
  });
  const deleteMutation = useMutation({
    mutationFn: async () => {
      const result = await deleteOwnPost(post.id);
      if (!result.ok) throw new Error(result.error);
    },
    onSuccess: () => {
      if (startExpanded) {
        router.push(
          post.scope === "discipleship"
            ? "/dashboard/community/discipleship"
            : post.scope === "group" && post.groupId != null
              ? `/dashboard/community/groups/${post.groupId}`
              : "/dashboard/community",
        );
      }
    },
    onError: (e) =>
      setNotice(e instanceof Error ? e.message : "Could not delete the post."),
    onSettled: invalidateFeed,
  });

  const pending =
    reactionMutation.isPending ||
    moderateMutation.isPending ||
    pinMutation.isPending ||
    deleteMutation.isPending;

  function like() {
    reactionMutation.mutate();
  }

  const isUnit = post.scope === "unit";
  const isDiscipleship = post.scope === "discipleship";
  const isMemberGroup = post.scope === "group";
  // Posts in a discipleship or member group stay inside that group.
  const staysInGroup = isDiscipleship || isMemberGroup;
  const scopeLabel = isDiscipleship
    ? (post.discipleshipGroupName ?? "Discipleship group")
    : isMemberGroup
      ? (post.groupName ?? "Group")
      : isUnit
        ? (post.unitName ?? "Group")
        : "Community";
  const railClass = staysInGroup
    ? "before:bg-(--purpose-accent)"
    : isUnit
      ? "before:bg-(--fulfil-accent)"
      : "before:bg-(--color-brand-blue)";
  const pillClass = staysInGroup
    ? "bg-(--purpose-accent-soft) text-(--purpose-accent)"
    : isUnit
      ? "bg-(--fulfil-accent-soft) text-(--fulfil-accent)"
      : "bg-(--muted) text-(--color-brand-blue)";
  const roleLabel = isDiscipleship
    ? post.authorKind === "leader"
      ? "Discipler"
      : "Disciple"
    : isMemberGroup
      ? post.authorKind === "leader"
        ? "Group admin"
        : "Member"
      : post.authorKind === "leader"
      ? isUnit
        ? "Group leader"
        : "Leader"
      : post.authorKind === "member"
        ? isUnit
          ? "Group member"
          : "Member"
        : null;
  const topic = post.kind === "discussion" ? topicLabel(post.topic) : null;

  const menuActions: MenuAction[] = [];
  if (post.messageUserId) {
    const authorId = post.messageUserId;
    menuActions.push({
      key: "message",
      label: `Message ${post.authorName}`,
      icon: MessageCircleIcon,
      onSelect: () => chat.open(authorId),
    });
  }
  if (post.isMine) {
    menuActions.push(
      {
        key: "edit",
        label: "Edit post",
        icon: PencilIcon,
        onSelect: () => setEditing(true),
      },
      {
        key: "delete",
        label: "Delete post",
        icon: Trash2Icon,
        danger: true,
        onSelect: () => {
          if (window.confirm("Delete this post? This can't be undone.")) {
            setNotice(null);
            deleteMutation.mutate();
          }
        },
      },
    );
  }
  if (post.canManage) {
    menuActions.push(
      {
        key: "pin",
        label: post.pinned ? "Unpin" : "Pin to top",
        icon: PinIcon,
        onSelect: () => pinMutation.mutate(!post.pinned),
      },
      {
        key: "hide",
        label: "Hide post",
        icon: EyeOffIcon,
        onSelect: () => moderateMutation.mutate("hide"),
      },
    );
  }
  if (!post.isMine) {
    menuActions.push({
      key: "report",
      label: "Report post",
      icon: FlagIcon,
      onSelect: () => setReporting(true),
    });
  }

  const actionButton =
    "flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium transition-colors";
  const alertText = notice ?? chat.error;

  return (
    <article
      className={`group relative overflow-hidden rounded-2xl border border-(--color-line-strong) bg-white shadow-[0_2px_12px_rgba(6,16,86,0.09)] transition-[transform,box-shadow] duration-150 ease-out hover:-translate-y-px hover:shadow-(--shadow-md) sm:shadow-(--shadow-sm) before:pointer-events-none before:absolute before:inset-y-0 before:left-0 before:w-1 before:content-[''] sm:before:w-0.75 ${railClass}`}
    >
      <div className="grid gap-3 p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <Avatar name={post.authorName} size={40} />
          <div className="min-w-0 flex-1">
            <p className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-sm font-semibold text-zinc-900">
              {post.authorName}
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[0.7rem] font-medium ${pillClass}`}
              >
                {scopeLabel}
              </span>
            </p>
            <p className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-zinc-500">
              {post.pinned ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[0.7rem] font-medium text-amber-700">
                  <PinIcon className="size-3" strokeWidth={2} />
                  Pinned
                </span>
              ) : null}
              {post.kind === "official" ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-(--muted) px-2 py-0.5 text-[0.7rem] font-medium text-(--color-brand-blue)">
                  <MegaphoneIcon className="size-3" strokeWidth={2} />
                  {staysInGroup ? "Announcement" : "Official"}
                </span>
              ) : topic ? (
                <span className="inline-flex items-center rounded-full bg-zinc-100 px-2 py-0.5 text-[0.7rem] font-medium text-zinc-600">
                  {topic}
                </span>
              ) : null}
              {roleLabel ? <span>{roleLabel} ·</span> : null}
              {relativeTime(post.lastActivityAt)}
            </p>
          </div>
          <ActionMenu
            label="Post options"
            actions={menuActions}
            className="-mr-1.5 -mt-1"
          />
        </div>

        {alertText ? (
          <p role="alert" className="text-[13px] text-red-700">
            {alertText}
          </p>
        ) : null}

        {editing ? (
          <PostEditForm post={post} onDone={() => setEditing(false)} />
        ) : (
          <>
            {post.title ? (
              <h2 className="ppc-heading text-base font-semibold text-zinc-900">
                {startExpanded ? (
                  post.title
                ) : (
                  <Link
                    href={`/dashboard/community/post/${post.id}`}
                    className="hover:underline"
                  >
                    {post.title}
                  </Link>
                )}
              </h2>
            ) : null}

            {post.body ? (
              <PostBody body={post.body} expanded={startExpanded} />
            ) : null}
          </>
        )}

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
                  {post.commentCount} comment
                  {post.commentCount === 1 ? "" : "s"}
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
        {/* A post in a discipleship or member group has no Share. */}
        {staysInGroup ? null : (
          <ShareMenu
            post={post}
            viewerUnitName={viewerUnitName}
            canRepost={canRepost}
            onShared={invalidateFeed}
            className={`${actionButton} text-zinc-600 hover:bg-zinc-50`}
          />
        )}
      </div>

      {showComments ? (
        <div className="border-t border-zinc-100 bg-zinc-50/50 px-4 py-4 sm:px-5">
          <CommentThread
            postId={post.id}
            viewerName={viewerName}
            isAdmin={isAdmin}
            canComment={post.canComment}
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

      <ReportDialog
        open={reporting}
        onOpenChange={setReporting}
        noun="post"
        onSubmit={(reason) =>
          reportContent({ targetType: "post", targetId: post.id, reason })
        }
      />
    </article>
  );
}

function ShareMenu({
  post,
  viewerUnitName,
  canRepost,
  onShared,
  className = "",
}: {
  post: FeedPost;
  viewerUnitName: string | null;
  canRepost: boolean;
  onShared: () => void;
  className?: string;
}) {
  const [mode, setMode] = useState<"menu" | "repost">("menu");
  const [note, setNote] = useState("");
  const [scope, setScope] = useState<"global" | "unit">("global");
  const [copied, setCopied] = useState(false);

  const shareMutation = useMutation({
    mutationFn: () =>
      sharePostToFeed({
        sourcePostId: post.sharedFrom?.id ?? post.id,
        scope,
        note,
      }),
    onSuccess: () => {
      setNote("");
      setMode("menu");
      onShared();
    },
  });
  const pending = shareMutation.isPending;

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
                {canRepost ? (
                  <button
                    type="button"
                    onClick={() => setMode("repost")}
                    className={menuItem}
                  >
                    <Repeat2Icon
                      className="size-4 text-zinc-400"
                      strokeWidth={2}
                    />
                    Share to feed
                  </button>
                ) : null}
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
                action={() => shareMutation.mutate()}
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

async function fetchComments(postId: number): Promise<PostComment[]> {
  const res = await fetch(`/api/community/posts/${postId}/comments`, {
    credentials: "same-origin",
  });
  if (!res.ok) throw new Error("Failed to load comments");
  const data = (await res.json()) as { comments: PostComment[] };
  return data.comments;
}

export function CommentThread({
  postId,
  viewerName = "You",
  isAdmin,
  canComment = true,
}: {
  postId: number;
  viewerName?: string;
  isAdmin: boolean;
  /** False when the viewer can read the post but must join its group to reply. */
  canComment?: boolean;
}) {
  const queryClient = useQueryClient();
  const chat = useOpenConversation();
  const [body, setBody] = useState("");
  const [replyTo, setReplyTo] = useState<number | null>(null);
  const [reportId, setReportId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const commentsKey = communityKeys.comments(postId);

  const {
    data: comments = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: commentsKey,
    queryFn: () => fetchComments(postId),
    refetchInterval: 20_000,
  });

  function patch(next: (list: PostComment[]) => PostComment[]) {
    queryClient.setQueryData<PostComment[]>(commentsKey, (old) =>
      next(old ?? []),
    );
  }
  function invalidateThread() {
    queryClient.invalidateQueries({ queryKey: commentsKey });
  }
  function invalidateFeed() {
    queryClient.invalidateQueries({ queryKey: communityKeys.feedRoot() });
  }

  const commentMutation = useMutation({
    mutationFn: (vars: { body: string; replyToId: number | null }) =>
      commentOnPost({ postId, body: vars.body, replyToId: vars.replyToId }),
    onMutate: async (vars) => {
      await queryClient.cancelQueries({ queryKey: commentsKey });
      const prev = queryClient.getQueryData<PostComment[]>(commentsKey);
      const optimistic: PostComment = {
        id: -Date.now(),
        body: vars.body,
        authorName: viewerName.trim().split(/\s+/)[0] || "You",
        authorId: "optimistic",
        isMine: true,
        replyToId: vars.replyToId,
        createdAt: new Date().toISOString(),
        status: "visible",
        reactionCount: 0,
        reactedByMe: false,
        canModerate: false,
        messageUserId: null,
      };
      patch((list) => [...list, optimistic]);
      return { prev };
    },
    onError: (_e, _v, context) => {
      if (context?.prev) queryClient.setQueryData(commentsKey, context.prev);
      setError("Could not post your comment. Try again.");
    },
    onSuccess: () => setError(null),
    onSettled: () => {
      invalidateThread();
      invalidateFeed();
    },
  });

  const likeMutation = useMutation({
    mutationFn: (commentId: number) => toggleCommentLike(commentId),
    onMutate: async (commentId) => {
      await queryClient.cancelQueries({ queryKey: commentsKey });
      const prev = queryClient.getQueryData<PostComment[]>(commentsKey);
      patch((list) =>
        list.map((c) =>
          c.id === commentId
            ? {
                ...c,
                reactedByMe: !c.reactedByMe,
                reactionCount: c.reactionCount + (c.reactedByMe ? -1 : 1),
              }
            : c,
        ),
      );
      return { prev };
    },
    onError: (_e, _v, context) => {
      if (context?.prev) queryClient.setQueryData(commentsKey, context.prev);
    },
    onSettled: invalidateThread,
  });

  const moderateMutation = useMutation({
    mutationFn: (vars: { commentId: number; action: "hide" | "restore" }) =>
      moderateComment(vars),
    onMutate: async (vars) => {
      if (vars.action !== "hide") return { prev: undefined };
      await queryClient.cancelQueries({ queryKey: commentsKey });
      const prev = queryClient.getQueryData<PostComment[]>(commentsKey);
      patch((list) =>
        list.map((c) =>
          c.id === vars.commentId
            ? { ...c, body: null, status: "hidden" as const }
            : c,
        ),
      );
      return { prev };
    },
    onError: (_e, _v, context) => {
      if (context?.prev) queryClient.setQueryData(commentsKey, context.prev);
    },
    onSettled: () => {
      invalidateThread();
      invalidateFeed();
    },
  });

  const pending =
    commentMutation.isPending ||
    likeMutation.isPending ||
    moderateMutation.isPending;

  function submit() {
    const text = body.trim();
    if (!text) return;
    setError(null);
    commentMutation.mutate({ body: text, replyToId: replyTo });
    setBody("");
    setReplyTo(null);
  }

  const topLevel = comments.filter((c) => c.replyToId == null);
  const repliesByParent = new Map<number, PostComment[]>();
  for (const c of comments) {
    if (c.replyToId != null) {
      repliesByParent.set(c.replyToId, [
        ...(repliesByParent.get(c.replyToId) ?? []),
        c,
      ]);
    }
  }

  return (
    <div className="grid gap-3">
      {canComment ? null : (
        <p className="text-xs text-zinc-500">Join this group to comment.</p>
      )}
      <form
        className={canComment ? "flex items-start gap-2" : "hidden"}
        action={() => submit()}
      >
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
          {error ?? chat.error ? (
            <p role="alert" className="mt-1 text-xs text-red-700">
              {error ?? chat.error}
            </p>
          ) : null}
        </div>
      </form>

      {isLoading ? (
        <p className="text-xs text-zinc-400">Loading comments…</p>
      ) : isError ? (
        <p className="text-xs text-zinc-500">
          Couldn&apos;t load comments.{" "}
          <button
            type="button"
            onClick={() => refetch()}
            className="underline underline-offset-2 hover:text-zinc-700"
          >
            Retry
          </button>
        </p>
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
                onReply={canComment ? () => setReplyTo(comment.id) : undefined}
                onLike={() => likeMutation.mutate(comment.id)}
                onModerate={(action) =>
                  moderateMutation.mutate({ commentId: comment.id, action })
                }
                onReport={() => setReportId(comment.id)}
                onMessage={chat.open}
              />
              {(repliesByParent.get(comment.id) ?? []).map((reply) => (
                <div key={reply.id} className="ml-10">
                  <CommentRow
                    comment={reply}
                    isAdmin={isAdmin}
                    pending={pending}
                    onLike={() => likeMutation.mutate(reply.id)}
                    onModerate={(action) =>
                      moderateMutation.mutate({ commentId: reply.id, action })
                    }
                    onReport={() => setReportId(reply.id)}
                    onMessage={chat.open}
                  />
                </div>
              ))}
            </li>
          ))}
        </ul>
      )}

      <ReportDialog
        open={reportId != null}
        onOpenChange={(open) => {
          if (!open) setReportId(null);
        }}
        noun="comment"
        onSubmit={(reason) =>
          reportContent({
            targetType: "comment",
            targetId: reportId ?? 0,
            reason,
          })
        }
      />
    </div>
  );
}

function CommentRow({
  comment,
  isAdmin,
  pending,
  onReply,
  onLike,
  onModerate,
  onReport,
  onMessage,
}: {
  comment: PostComment;
  isAdmin: boolean;
  pending: boolean;
  onReply?: () => void;
  onLike: () => void;
  onModerate: (action: "hide" | "restore") => void;
  onReport: () => void;
  onMessage: (userId: string) => void;
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
            <button type="button" onClick={onReply} className="hover:underline">
              Reply
            </button>
          ) : null}
          <span className="text-zinc-400">
            {relativeTime(comment.createdAt)}
          </span>
          {comment.messageUserId ? (
            <button
              type="button"
              onClick={() => onMessage(comment.messageUserId!)}
              className="hover:underline"
            >
              Message
            </button>
          ) : null}
          {!comment.isMine && comment.body != null && comment.id > 0 ? (
            <button type="button" onClick={onReport} className="hover:underline">
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
