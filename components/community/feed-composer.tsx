"use client";

import { useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ImagePlusIcon, XIcon } from "lucide-react";

import type { PostImage, PostScope } from "@/lib/db/queries/community-posts";
import { POSTING_PAUSED_COPY } from "@/lib/community/errors";
import {
  POST_BODY_MAX,
  POST_TITLE_MAX,
  type PostKind,
} from "@/lib/community/post-input";
import { communityKeys } from "@/lib/community/query-keys";
import { COMMUNITY_TOPICS } from "@/lib/community/topics";
import { createPost } from "@/app/(site)/dashboard/community/_actions/feed-actions";
import { useUploadThing } from "@/lib/upload/uploadthing-client";

import { Avatar } from "./avatar";

const MAX_IMAGES = 4;

const fieldClass =
  "w-full rounded-xl border border-zinc-200 px-3 text-base outline-none focus:border-zinc-300 sm:text-[15px]";

/**
 * Where the viewer may publish an announcement: nowhere (members), inside
 * their own group (leaders), or anywhere (admins). Everyone can raise a
 * discussion.
 */
export type OfficialReach = "none" | "unit" | "all";

/** A specific space the composer is locked to: a unit, discipleship group or member group. */
export type PostTarget = {
  scope: "unit" | "discipleship" | "group";
  id: number;
};

export function FeedComposer({
  viewerName = "You",
  unitName,
  target = null,
  officialReach = "none",
  postingBlocked = false,
}: {
  viewerName?: string;
  /** The viewer's own location group, offered as a destination when no target is set. */
  unitName: string | null;
  /** Lock every post to one space. Without it the viewer picks community or their own unit. */
  target?: PostTarget | null;
  officialReach?: OfficialReach;
  postingBlocked?: boolean;
}) {
  const defaultScope: PostScope = target?.scope ?? "global";
  const lockScope = target != null;
  const queryClient = useQueryClient();
  const defaultKind: PostKind = officialReach === "all" ? "official" : "discussion";
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<PostKind>(defaultKind);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [topic, setTopic] = useState("");
  const [scope, setScope] = useState<PostScope>(defaultScope);
  const [images, setImages] = useState<PostImage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // "unit" reach announces inside the viewer's own location group only.
  const officialAllowed =
    officialReach === "all" || (officialReach === "unit" && scope === "unit");
  const postKind: PostKind =
    kind === "official" && officialAllowed ? "official" : "discussion";
  const isDiscussion = postKind === "discussion";

  const { startUpload, isUploading } = useUploadThing("communityImage", {
    onClientUploadComplete: (results) => {
      const next = results.map((r) => ({
        url: (r as { ufsUrl?: string; url: string }).ufsUrl ?? r.url,
        key: r.key,
      }));
      setImages((current) => [...current, ...next].slice(0, MAX_IMAGES));
    },
    onUploadError: (e) => setError(e.message || "Image upload failed."),
  });

  function reset() {
    setKind(defaultKind);
    setTitle("");
    setBody("");
    setTopic("");
    setImages([]);
    setScope(defaultScope);
    setError(null);
    setOpen(false);
  }

  const postMutation = useMutation({
    mutationFn: async () => {
      const result = await createPost({
        scope,
        targetId: target?.id ?? null,
        kind: postKind,
        title,
        topic: isDiscussion ? topic || null : null,
        body,
        images,
      });
      if (!result.ok) throw new Error(result.error);
    },
    onSuccess: () => {
      reset();
      queryClient.invalidateQueries({ queryKey: communityKeys.feedRoot() });
    },
    onError: (e) =>
      setError(e instanceof Error ? e.message : "Could not post."),
  });
  const pending = postMutation.isPending;

  function pickFiles(list: FileList | null) {
    if (!list || list.length === 0) return;
    const room = MAX_IMAGES - images.length;
    if (room <= 0) return;
    void startUpload(Array.from(list).slice(0, room));
  }

  if (postingBlocked) {
    return (
      <p className="rounded-2xl border border-(--color-line-strong) bg-white p-4 text-sm text-zinc-600 shadow-(--shadow-sm)">
        {POSTING_PAUSED_COPY} You can still read and like posts.
      </p>
    );
  }

  if (!open) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-(--color-line-strong) bg-white p-3 shadow-(--shadow-sm)">
        <Avatar name={viewerName} size={40} />
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="h-10 flex-1 rounded-full bg-zinc-100 px-4 text-left text-xs text-zinc-500 transition-colors hover:bg-zinc-200/70"
        >
          {officialReach === "all"
            ? "Share an update or start a discussion…"
            : "Start a discussion…"}
        </button>
      </div>
    );
  }

  return (
    <form
      className="grid gap-3 rounded-2xl border border-(--color-line-strong) bg-white p-4 shadow-(--shadow-sm)"
      action={() => {
        setError(null);
        postMutation.mutate();
      }}
    >
      <div className="flex items-start gap-3">
        <Avatar name={viewerName} size={40} />
        <div className="grid min-w-0 flex-1 gap-2">
          {officialReach !== "none" ? (
            <div
              role="group"
              aria-label="Post type"
              className="flex w-fit items-center gap-0.5 rounded-full border border-zinc-200 p-0.5"
            >
              {(
                [
                  ["discussion", "Discussion"],
                  ["official", "Announcement"],
                ] as const
              ).map(([value, label]) => {
                const active = postKind === value;
                const unavailable = value === "official" && !officialAllowed;
                return (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={active}
                    disabled={unavailable}
                    title={
                      unavailable
                        ? "Announcements go to your own group"
                        : undefined
                    }
                    onClick={() => setKind(value)}
                    className={`h-7 rounded-full px-3 text-[13px] font-medium transition-colors disabled:opacity-40 ${
                      active
                        ? "bg-(--muted) text-(--color-brand-blue)"
                        : "text-zinc-500 hover:text-zinc-800"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          ) : null}

          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={
              isDiscussion
                ? "Title: what would you like to discuss?"
                : "Title (optional)"
            }
            aria-label="Title"
            maxLength={POST_TITLE_MAX}
            required={isDiscussion}
            autoFocus
            className={`${fieldClass} h-11 font-medium`}
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={
              isDiscussion
                ? "Add more detail (optional)"
                : "What would you like to share?"
            }
            aria-label="Post"
            rows={4}
            maxLength={POST_BODY_MAX}
            className={`${fieldClass} resize-none py-3 leading-relaxed`}
          />
        </div>
      </div>

      {images.length > 0 ? (
        <div className="grid grid-cols-4 gap-2 pl-13">
          {images.map((img) => (
            <div key={img.key} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.url}
                alt=""
                className="h-16 w-full rounded-lg object-cover"
              />
              <button
                type="button"
                onClick={() =>
                  setImages((c) => c.filter((x) => x.key !== img.key))
                }
                className="absolute -right-1.5 -top-1.5 inline-flex size-5 items-center justify-center rounded-full bg-zinc-900 text-white"
                aria-label="Remove image"
              >
                <XIcon className="size-3" strokeWidth={2.5} />
              </button>
            </div>
          ))}
        </div>
      ) : null}

      {error ? (
        <p role="alert" className="pl-13 text-[13px] text-red-700">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-2 pl-13">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => {
            pickFiles(e.target.files);
            e.target.value = "";
          }}
        />
        <button
          type="button"
          disabled={isUploading || images.length >= MAX_IMAGES}
          onClick={() => fileRef.current?.click()}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-zinc-200 px-3 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-50 disabled:opacity-50"
        >
          <ImagePlusIcon className="size-4" strokeWidth={2} />
          {isUploading ? "Uploading…" : "Photo"}
        </button>

        {isDiscussion ? (
          <select
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            aria-label="Topic"
            className={`h-9 rounded-lg border border-zinc-200 px-2 text-sm ${
              topic ? "text-zinc-900" : "text-zinc-500"
            }`}
          >
            <option value="">Topic (optional)</option>
            {COMMUNITY_TOPICS.map((option) => (
              <option key={option.key} value={option.key}>
                {option.label}
              </option>
            ))}
          </select>
        ) : null}

        {unitName && !lockScope ? (
          <select
            value={scope}
            onChange={(e) => setScope(e.target.value as PostScope)}
            aria-label="Where to post"
            className="h-9 max-w-44 rounded-lg border border-zinc-200 px-2 text-sm"
          >
            <option value="global">Whole community</option>
            <option value="unit">{unitName}</option>
          </select>
        ) : null}

        <div className="ml-auto flex items-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="text-sm text-zinc-500 hover:underline"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={pending || isUploading}
            className="inline-flex h-9 items-center rounded-lg bg-[var(--color-brand-blue)] px-4 text-sm font-semibold text-white disabled:opacity-50"
          >
            {pending ? "Posting…" : "Post"}
          </button>
        </div>
      </div>
    </form>
  );
}
