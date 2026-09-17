"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Loader2, RotateCcw, Share2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  MAX_LEARNING_PROGRESS_WORDS,
  buildLearningProgressShareMessage,
  countWords,
  validateLearningProgressQuote,
} from "@/lib/sogp/learning-progress-share";
import {
  PRE_SOGP_SHARE_PLATFORMS,
  buildPreSogpShareIntentUrl,
  type PreSogpShareIntentPlatform,
} from "@/lib/sogp/share";

import { ShareIntentButtons } from "./share-intent-buttons";

const INTENT_PLATFORMS = PRE_SOGP_SHARE_PLATFORMS.filter(
  (platform): platform is PreSogpShareIntentPlatform =>
    platform !== "copy" && platform !== "native",
);

type ShareResult = { id: number; imageUrl: string; referralUrl: string };

async function submitShare(input: {
  track: "sogp" | "pre_sogp";
  dayNumber?: number;
  quote: string;
}): Promise<ShareResult> {
  const response = await fetch("/api/sogp/learning-progress-shares", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const payload = (await response.json().catch(() => null)) as
    | (ShareResult & { error?: string })
    | null;
  if (!response.ok || !payload) {
    throw new Error(payload?.error ?? "Could not save your reflection.");
  }
  return payload;
}

export function ShareLearningProgressDialog({
  open,
  onOpenChange,
  track,
  dayNumber,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  track: "sogp" | "pre_sogp";
  dayNumber?: number;
}) {
  const [quote, setQuote] = useState("");
  const [share, setShare] = useState<ShareResult | null>(null);
  const [imageBlob, setImageBlob] = useState<Blob | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingImage, setLoadingImage] = useState(false);
  const objectUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
  }, []);

  function reset() {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    setQuote("");
    setShare(null);
    setImageBlob(null);
    setImageUrl(null);
    setError(null);
  }

  const mutation = useMutation({
    mutationFn: submitShare,
    onSuccess: async (result) => {
      setShare(result);
      setLoadingImage(true);
      try {
        const response = await fetch(result.imageUrl, {
          credentials: "same-origin",
        });
        if (!response.ok) throw new Error("Image could not be generated.");
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        objectUrlRef.current = url;
        setImageBlob(blob);
        setImageUrl(url);
      } catch (imageError) {
        setError(
          imageError instanceof Error
            ? imageError.message
            : "Image could not be generated.",
        );
      } finally {
        setLoadingImage(false);
      }
    },
    onError: (submitError) => {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Could not save your reflection.",
      );
    },
  });

  const words = countWords(quote);
  const { error: validationError } = validateLearningProgressQuote(quote);
  const canSubmit = quote.trim().length > 0 && !validationError;

  async function handleShare() {
    if (!imageBlob || !share) return;
    const file = new File([imageBlob], "sogp-learning-progress.png", {
      type: imageBlob.type || "image/png",
    });
    const text = buildLearningProgressShareMessage({ quote: quote.trim() });
    try {
      if (
        typeof navigator !== "undefined" &&
        "canShare" in navigator &&
        navigator.canShare({ files: [file] })
      ) {
        await navigator.share({ files: [file], text, url: share.referralUrl });
        return;
      }
    } catch (shareError) {
      if ((shareError as DOMException)?.name === "AbortError") return;
    }
    // Fall back to a plain download when file sharing isn't supported.
    const anchor = document.createElement("a");
    anchor.href = imageUrl ?? "";
    anchor.download = "sogp-learning-progress.png";
    anchor.click();
  }

  const message = share
    ? buildLearningProgressShareMessage({ quote: quote.trim() })
    : "";
  const hrefs = share
    ? (Object.fromEntries(
      INTENT_PLATFORMS.map((platform) => [
        platform,
        buildPreSogpShareIntentUrl({
          platform,
          postUrl: share.referralUrl,
          message,
        }),
      ]),
    ) as Record<PreSogpShareIntentPlatform, string>)
    : null;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) reset();
      }}
    >
      <DialogContent className="gap-2.5">
        <DialogHeader>
          <DialogTitle>Share your learning progress</DialogTitle>
          <DialogDescription>
            {share
              ? "Your card is ready — share it or download it."
              : "Write a short reflection and we'll turn it into a shareable card."}
          </DialogDescription>
        </DialogHeader>

        {!share ? (
          <div className="grid gap-3">
            <label className="grid gap-2 text-sm">
              <textarea
                value={quote}
                onChange={(event) => setQuote(event.target.value)}
                rows={5}
                placeholder="What has this SOGP journey been teaching you?"
                className="w-full resize-y rounded-[var(--radius-sm)] border border-[var(--color-line-strong)] p-3 text-sm leading-[1.6] outline-none focus-visible:border-[var(--color-brand-blue)]"
              />
              <span
                className={`justify-self-end text-xs ${words > MAX_LEARNING_PROGRESS_WORDS
                    ? "text-red-600"
                    : "text-[var(--color-text-muted)]"
                  }`}
              >
                {words} / {MAX_LEARNING_PROGRESS_WORDS} words
              </span>
            </label>
            {error ? (
              <p role="alert" className="text-sm text-red-700">
                {error}
              </p>
            ) : null}
            <DialogFooter>
              <button
                type="button"
                disabled={!canSubmit || mutation.isPending}
                onClick={() => {
                  setError(null);
                  mutation.mutate({ track, dayNumber, quote: quote.trim() });
                }}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[var(--color-brand-blue)] px-5 text-sm font-semibold text-white disabled:opacity-50"
              >
                {mutation.isPending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" /> Generating…
                  </>
                ) : (
                  "Generate my card"
                )}
              </button>
            </DialogFooter>
          </div>
        ) : (
          <div className="grid gap-4">
            <div className="overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-line)] bg-[var(--color-surface-muted)]">
              {loadingImage || !imageUrl ? (
                <div className="grid aspect-square place-items-center">
                  <Loader2 className="size-6 animate-spin text-[var(--color-brand-blue)]" />
                </div>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imageUrl} alt="Your learning progress card" className="w-full" />
              )}
            </div>
            {error ? (
              <p role="alert" className="text-sm text-red-700">
                {error}
              </p>
            ) : null}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={!imageBlob}
                onClick={handleShare}
                className="inline-flex min-h-10 items-center gap-2 rounded-full bg-[var(--color-brand-blue)] px-4 text-xs font-semibold text-white disabled:opacity-50"
              >
                <Share2 className="size-3.5" /> Share image
              </button>
              <a
                href={imageUrl ?? undefined}
                download="sogp-learning-progress.png"
                className={`inline-flex min-h-10 items-center gap-2 rounded-full border border-[var(--color-brand-blue)] px-4 text-xs font-semibold text-[var(--color-brand-blue)] ${imageUrl ? "" : "pointer-events-none opacity-50"
                  }`}
              >
                Download image
              </a>
              <button
                type="button"
                onClick={reset}
                className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[var(--color-line-strong)] px-4 text-xs font-semibold text-[var(--color-text-strong)]"
              >
                <RotateCcw className="size-3.5" /> Write a different one
              </button>
            </div>
            {hrefs ? (
              <div className="grid gap-2 border-t border-[var(--color-line)] pt-4">
                <p className="text-xs font-semibold text-[var(--color-text-muted)]">
                  Invite others to join SOGP with your link
                </p>
                <ShareIntentButtons
                  hrefs={hrefs}
                  copyValue={share.referralUrl}
                  nativeShare={{
                    title: "SOGP learning progress",
                    text: message,
                    url: share.referralUrl,
                  }}
                />
              </div>
            ) : null}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
