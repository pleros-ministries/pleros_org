"use client";

import { useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ImagePlusIcon, XIcon, TagIcon, GlobeIcon } from "lucide-react";

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
import { ChipSelect } from "./chip-select";

const MAX_IMAGES = 4;


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
      <p className="rounded-2xl border border-[var(--color-community-edge)] bg-white p-4 text-[13.5px] text-[var(--color-community-ink)] ">
        {POSTING_PAUSED_COPY} You can still read and like posts.
      </p>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-2.5 rounded-[10px] border border-[var(--dashboard-panel-edge,#e2e5ea)] bg-white py-2 pr-2 pl-2.5 text-left transition-colors hover:border-[var(--color-community-edge-strong)]"
      >
        <Avatar name={viewerName} size={30} />
        <span className="min-w-0 flex-1 truncate text-[13.5px] leading-[20px] text-[#8a9099]">
          {officialReach === "all" ? "Share something with the community…" : "Start a discussion…"}
        </span>
        <span className="grid size-8 place-items-center text-[var(--color-community-muted)]" aria-hidden><ImagePlusIcon className="size-[18px]" strokeWidth={1.8} /></span>
      </button>
    );
  }

  return (
    <form
      className="overflow-hidden rounded-[10px] border border-[var(--dashboard-panel-edge,#e2e5ea)] bg-white"
      action={() => {
        setError(null);
        postMutation.mutate();
      }}
    >
      {/* Header: who is posting, and the post type as a small rail. */}
      <div className="flex items-center gap-2.5 px-3.5 pt-3">
        <Avatar name={viewerName} size={30} />
        <span className="min-w-0 flex-1 truncate text-[13.5px] font-semibold text-[var(--color-community-ink)]">{viewerName}</span>
        {officialReach !== "none" ? (
          <div role="group" aria-label="Post type" className="flex items-center rounded-lg bg-[#eceef2] p-[2px]">
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
                  title={unavailable ? "Announcements go to your own group" : undefined}
                  onClick={() => setKind(value)}
                  className={`inline-flex h-6 items-center rounded-md px-2 text-[12px] font-medium transition-colors disabled:opacity-40 ${
                    active
                      ? "bg-white text-[var(--color-community-ink)] shadow-[0_1px_2px_rgb(0_0_0/8%)]"
                      : "text-[var(--color-community-muted)] hover:text-[var(--color-community-ink)]"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>

      {/* Borderless fields; 16px so phones never zoom. */}
      <div className="grid px-3.5 pt-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={isDiscussion ? "What would you like to discuss?" : "Title (optional)"}
          aria-label="Title"
          maxLength={POST_TITLE_MAX}
          required={isDiscussion}
          autoFocus
          className="h-9 w-full bg-transparent font-[family-name:var(--font-dashboard-heading)] text-[16px] font-medium text-[var(--color-community-ink)] outline-none placeholder:text-[#9aa0a8]"
        />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={isDiscussion ? "Add more detail (optional)" : "What would you like to share?"}
          aria-label="Post"
          rows={3}
          maxLength={POST_BODY_MAX}
          className="w-full resize-none bg-transparent py-1 text-[16px] leading-[24px] text-[var(--color-community-ink)] outline-none placeholder:text-[#9aa0a8]"
        />
      </div>

      {images.length > 0 ? (
        <div className="grid grid-cols-4 gap-2 px-3.5 pb-2">
          {images.map((img) => (
            <div key={img.key} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.url} alt="" className="h-16 w-full rounded-lg object-cover" />
              <button
                type="button"
                onClick={() => setImages((c) => c.filter((x) => x.key !== img.key))}
                className="absolute -right-1.5 -top-1.5 inline-flex size-5 items-center justify-center rounded-full bg-[var(--color-community-ink)] text-white"
                aria-label="Remove image"
              >
                <XIcon className="size-3" strokeWidth={2.5} />
              </button>
            </div>
          ))}
        </div>
      ) : null}

      {error ? (
        <p role="alert" className="px-3.5 pb-2 text-[13px] text-red-700">
          {error}
        </p>
      ) : null}

      {/* Toolbar: attach and audience on the left, Cancel and Post on the right. */}
      <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 border-t border-[var(--color-line,#e7e9ec)] px-2 py-1.5">
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
          aria-label={isUploading ? "Uploading photo" : "Add photo"}
          className="grid size-9 place-items-center rounded-lg text-[var(--color-community-muted)] transition-colors hover:bg-[var(--color-community-canvas)] disabled:opacity-50"
        >
          <ImagePlusIcon className="size-[18px]" strokeWidth={1.8} />
        </button>

        {isDiscussion ? (
          <ChipSelect
            label="Topic"
            icon={TagIcon}
            value={topic}
            placeholder="Topic"
            menuTitle="Topic"
            options={[{ value: "", label: "No topic" }, ...COMMUNITY_TOPICS.map((option) => ({ value: option.key, label: option.label }))]}
            onChange={setTopic}
          />
        ) : null}

        {unitName && !lockScope ? (
          <ChipSelect
            label="Where to post"
            icon={GlobeIcon}
            value={scope}
            menuTitle="Post to"
            options={[{ value: "global", label: "Everyone" }, { value: "unit", label: unitName }]}
            onChange={(next) => setScope(next as PostScope)}
          />
        ) : null}

        <div className="ml-auto flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={reset}
            className="h-8 rounded-[10px] px-3 text-[13px] font-medium text-[var(--color-community-muted)] hover:bg-[var(--color-community-canvas)]"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={pending || isUploading}
            className="inline-flex h-8 items-center rounded-[10px] bg-[var(--color-community-blue)] px-3.5 text-[13px] font-semibold text-white disabled:opacity-50"
          >
            {pending ? "Posting…" : "Post"}
          </button>
        </div>
      </div>
    </form>
  );
}
