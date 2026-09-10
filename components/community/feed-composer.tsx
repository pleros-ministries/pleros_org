"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ImagePlusIcon, XIcon } from "lucide-react";

import type { PostImage } from "@/lib/db/queries/community-posts";
import { createPost } from "@/app/(site)/dashboard/community/_actions/feed-actions";
import { useUploadThing } from "@/lib/upload/uploadthing-client";

const MAX_IMAGES = 4;

export function FeedComposer({
  unitName,
  defaultScope = "global",
  lockScope = false,
}: {
  unitName: string | null;
  defaultScope?: "global" | "unit";
  lockScope?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
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

  function pickFiles(list: FileList | null) {
    if (!list || list.length === 0) return;
    const room = MAX_IMAGES - images.length;
    if (room <= 0) return;
    void startUpload(Array.from(list).slice(0, room));
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full rounded-sm border border-zinc-200 bg-white px-4 py-3 text-left text-sm text-zinc-400 transition-colors hover:border-zinc-300"
      >
        Share something with the community…
      </button>
    );
  }

  return (
    <form
      className="grid gap-2 rounded-sm border border-zinc-200 bg-white p-4"
      action={() => {
        setError(null);
        startTransition(async () => {
          try {
            await createPost({ scope, body, images });
            reset();
            router.refresh();
          } catch (e) {
            setError(e instanceof Error ? e.message : "Could not post.");
          }
        });
      }}
    >
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="What would you like to share?"
        rows={4}
        autoFocus
        className="rounded-sm border border-zinc-200 p-2 text-sm"
      />

      {images.length > 0 ? (
        <div className="grid grid-cols-4 gap-1.5">
          {images.map((img) => (
            <div key={img.key} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.url}
                alt=""
                className="h-16 w-full rounded-sm object-cover"
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

      {error ? <p className="text-xs text-red-700">{error}</p> : null}

      <div className="flex flex-wrap items-center gap-2">
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
          className="inline-flex h-8 items-center gap-1.5 rounded-sm border border-zinc-200 px-2.5 text-xs font-medium text-zinc-600 disabled:opacity-50"
        >
          <ImagePlusIcon className="size-3.5" strokeWidth={2} />
          {isUploading ? "Uploading…" : "Photo"}
        </button>

        {unitName && !lockScope ? (
          <select
            value={scope}
            onChange={(e) => setScope(e.target.value as "global" | "unit")}
            className="h-8 rounded-sm border border-zinc-200 px-1 text-xs"
          >
            <option value="global">To the community</option>
            <option value="unit">To {unitName}</option>
          </select>
        ) : null}

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={reset}
            className="text-xs text-zinc-500 underline underline-offset-2"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={pending || isUploading}
            className="inline-flex h-8 items-center rounded-sm bg-[var(--color-brand-blue)] px-3 text-xs font-semibold text-white disabled:opacity-50"
          >
            {pending ? "Posting…" : "Post"}
          </button>
        </div>
      </div>
    </form>
  );
}
