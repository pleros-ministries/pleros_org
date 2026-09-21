"use client";

import { useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ImagePlusIcon, XIcon } from "lucide-react";

import type { PostImage } from "@/lib/db/queries/community-posts";
import { communityKeys } from "@/lib/community/query-keys";
import { createPost } from "@/app/(site)/dashboard/community/_actions/feed-actions";
import { useUploadThing } from "@/lib/upload/uploadthing-client";

import { Avatar } from "./avatar";

const MAX_IMAGES = 4;

export function FeedComposer({
  viewerName = "You",
  unitName,
  defaultScope = "global",
  lockScope = false,
}: {
  viewerName?: string;
  unitName: string | null;
  defaultScope?: "global" | "unit";
  lockScope?: boolean;
}) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState("");
  const [scope, setScope] = useState<"global" | "unit">(defaultScope);
  const [images, setImages] = useState<PostImage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

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
    setBody("");
    setImages([]);
    setScope(defaultScope);
    setError(null);
    setOpen(false);
  }

  const postMutation = useMutation({
    mutationFn: () => createPost({ scope, body, images }),
    onSuccess: () => {
      reset();
      queryClient.invalidateQueries({ queryKey: communityKeys.feed() });
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

  if (!open) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-(--color-line-strong) bg-white p-3 shadow-(--shadow-sm)">
        <Avatar name={viewerName} size={40} />
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="h-10 flex-1 rounded-full bg-zinc-100 px-4 text-left text-xs text-zinc-500 transition-colors hover:bg-zinc-200/70"
        >
          Share something with the community…
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
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="What would you like to share?"
          rows={4}
          autoFocus
          className="flex-1 resize-none rounded-xl border border-zinc-200 p-3 text-[15px] leading-relaxed outline-none focus:border-zinc-300"
        />
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

      {error ? <p className="pl-13 text-xs text-red-700">{error}</p> : null}

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

        {unitName && !lockScope ? (
          <select
            value={scope}
            onChange={(e) => setScope(e.target.value as "global" | "unit")}
            className="h-9 rounded-lg border border-zinc-200 px-2 text-sm"
          >
            <option value="global">To the community</option>
            <option value="unit">To {unitName}</option>
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
