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
  DEFAULT_LEARNING_PROGRESS_SHARE_TEMPLATE,
  LEARNING_PROGRESS_SHARE_TEMPLATES,
  MAX_LEARNING_PROGRESS_CHARS,
  MAX_LEARNING_PROGRESS_WORDS,
  buildLearningProgressShareMessage,
  buildLearningProgressVideoShareMessage,
  countWords,
  validateLearningProgressQuote,
  type LearningProgressShareTemplate,
} from "@/lib/sogp/learning-progress-share";
import {
  PRE_SOGP_SHARE_PLATFORMS,
  buildPreSogpShareIntentUrl,
  type PreSogpShareIntentPlatform,
} from "@/lib/sogp/share";

import { RecordLearningProgressVideo } from "./record-learning-progress-video";
import { ShareIntentButtons } from "./share-intent-buttons";

const INTENT_PLATFORMS = PRE_SOGP_SHARE_PLATFORMS.filter(
  (platform): platform is PreSogpShareIntentPlatform =>
    platform !== "copy" && platform !== "native",
);

type ShareResult = {
  id: number;
  kind: "image" | "video";
  imageUrl?: string;
  referralUrl: string;
};

async function submitShare(input: {
  track: "sogp" | "pre_sogp";
  dayNumber?: number;
  quote?: string;
  template?: LearningProgressShareTemplate;
  kind: "image" | "video";
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
  const [mode, setMode] = useState<"image" | "video">("image");
  const [quote, setQuote] = useState("");
  const [template, setTemplate] = useState<LearningProgressShareTemplate>(
    DEFAULT_LEARNING_PROGRESS_SHARE_TEMPLATE,
  );
  const [share, setShare] = useState<ShareResult | null>(null);
  const [imageBlob, setImageBlob] = useState<Blob | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoMimeType, setVideoMimeType] = useState("video/webm");
  const [recordAttempt, setRecordAttempt] = useState(0);
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
    setMode("image");
    setQuote("");
    setTemplate(DEFAULT_LEARNING_PROGRESS_SHARE_TEMPLATE);
    setShare(null);
    setImageBlob(null);
    setImageUrl(null);
    setVideoBlob(null);
    setVideoUrl(null);
    setRecordAttempt(0);
    setError(null);
  }

  const imageMutation = useMutation({
    mutationFn: submitShare,
    onSuccess: async (result) => {
      setShare(result);
      setLoadingImage(true);
      try {
        const response = await fetch(result.imageUrl!, {
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

  const videoMutation = useMutation({
    mutationFn: submitShare,
    onSuccess: (result) => {
      setShare(result);
    },
    onError: (submitError) => {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Could not save your video.",
      );
      // Let the learner try recording again.
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
      setVideoBlob(null);
      setVideoUrl(null);
      setRecordAttempt((value) => value + 1);
    },
  });

  const { error: validationError } = validateLearningProgressQuote(quote);
  const canSubmit = quote.trim().length > 0 && !validationError;

  function handleVideoRecorded(blob: Blob, mimeType: string) {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
    }
    const url = URL.createObjectURL(blob);
    objectUrlRef.current = url;
    setVideoBlob(blob);
    setVideoMimeType(mimeType);
    setVideoUrl(url);
    setError(null);
    videoMutation.mutate({ track, dayNumber, kind: "video" });
  }

  async function handleShare() {
    if (!share) return;

    if (share.kind === "video") {
      if (!videoBlob) return;
      const extension = videoMimeType.includes("mp4") ? "mp4" : "webm";
      const file = new File(
        [videoBlob],
        `sogp-learning-progress.${extension}`,
        { type: videoMimeType },
      );
      const text = buildLearningProgressVideoShareMessage();
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
      const anchor = document.createElement("a");
      anchor.href = videoUrl ?? "";
      anchor.download = `sogp-learning-progress.${extension}`;
      anchor.click();
      return;
    }

    if (!imageBlob) return;
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
    ? share.kind === "video"
      ? buildLearningProgressVideoShareMessage()
      : buildLearningProgressShareMessage({ quote: quote.trim() })
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
      <DialogContent className="max-h-[85vh] gap-2.5 overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Share your learning progress</DialogTitle>
          <DialogDescription>
            {share
              ? share.kind === "video"
                ? "Your video is ready — share it or download it."
                : "Your card is ready — share it or download it."
              : mode === "video"
                ? "Record a short video and we'll add our branding to it."
                : "Write a short reflection and we'll turn it into a shareable card."}
          </DialogDescription>
        </DialogHeader>

        {!share ? (
          <div className="grid gap-3">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setMode("image")}
                aria-pressed={mode === "image"}
                className={`min-h-9 rounded-full px-3 text-xs font-semibold ${
                  mode === "image"
                    ? "bg-[var(--color-brand-blue)] text-white"
                    : "border border-[var(--color-line-strong)] text-[var(--color-text-strong)]"
                }`}
              >
                Write a reflection
              </button>
              <button
                type="button"
                onClick={() => setMode("video")}
                aria-pressed={mode === "video"}
                className={`min-h-9 rounded-full px-3 text-xs font-semibold ${
                  mode === "video"
                    ? "bg-[var(--color-brand-blue)] text-white"
                    : "border border-[var(--color-line-strong)] text-[var(--color-text-strong)]"
                }`}
              >
                Record a video
              </button>
            </div>

            {mode === "video" ? (
              <>
                {error ? (
                  <p role="alert" className="text-sm text-red-700">
                    {error}
                  </p>
                ) : null}
                <RecordLearningProgressVideo
                  key={recordAttempt}
                  track={track}
                  dayNumber={dayNumber}
                  onRecorded={handleVideoRecorded}
                />
              </>
            ) : (
              <>
                <div className="grid gap-2">
                  <span className="text-xs font-semibold text-[var(--color-text-muted)]">
                    Choose a design
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    {LEARNING_PROGRESS_SHARE_TEMPLATES.map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => setTemplate(option.id)}
                        aria-pressed={template === option.id}
                        className={`grid gap-1.5 rounded-[var(--radius-sm)] p-1.5 outline-none ${
                          template === option.id
                            ? "ring-2 ring-[var(--color-brand-blue)] ring-offset-2"
                            : "ring-1 ring-[var(--color-line)]"
                        }`}
                      >
                        <span
                          className="grid aspect-square w-full place-items-end rounded-[calc(var(--radius-sm)-4px)] p-2"
                          style={{ backgroundColor: option.background }}
                        >
                          <span
                            className="h-2/5 w-full rounded-[3px]"
                            style={{
                              backgroundColor:
                                option.id === "light-card" ? "#ffffff" : "transparent",
                              border:
                                option.id === "dark-card"
                                  ? "2px solid #ffffff"
                                  : undefined,
                            }}
                          />
                        </span>
                        <span className="text-[0.65rem] font-semibold text-[var(--color-text-strong)]">
                          {option.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
                <label className="grid gap-2 text-sm">
                  <textarea
                    value={quote}
                    onChange={(event) => setQuote(event.target.value)}
                    rows={3}
                    placeholder="Sum up today's lesson in one sentence…"
                    className="w-full resize-y rounded-[var(--radius-sm)] border border-[var(--color-line-strong)] p-3 text-sm leading-[1.6] outline-none focus-visible:border-[var(--color-brand-blue)]"
                  />
                  <span
                    className={`justify-self-end text-xs ${quote.length > MAX_LEARNING_PROGRESS_CHARS ||
                        countWords(quote) > MAX_LEARNING_PROGRESS_WORDS
                        ? "text-red-600"
                        : "text-[var(--color-text-muted)]"
                      }`}
                  >
                    {quote.length} / {MAX_LEARNING_PROGRESS_CHARS} characters ·{" "}
                    {countWords(quote)} / {MAX_LEARNING_PROGRESS_WORDS} words
                  </span>
                </label>
                {validationError && quote.trim().length > 0 ? (
                  <p role="alert" className="text-sm text-red-700">
                    {validationError}
                  </p>
                ) : null}
                {error ? (
                  <p role="alert" className="text-sm text-red-700">
                    {error}
                  </p>
                ) : null}
                <DialogFooter>
                  <button
                    type="button"
                    disabled={!canSubmit || imageMutation.isPending}
                    onClick={() => {
                      setError(null);
                      imageMutation.mutate({
                        track,
                        dayNumber,
                        quote: quote.trim(),
                        template,
                        kind: "image",
                      });
                    }}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[var(--color-brand-blue)] px-5 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    {imageMutation.isPending ? (
                      <>
                        <Loader2 className="size-4 animate-spin" /> Generating…
                      </>
                    ) : (
                      "Generate my card"
                    )}
                  </button>
                </DialogFooter>
              </>
            )}
          </div>
        ) : (
          <div className="grid gap-4">
            <div className="overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-line)] bg-[var(--color-surface-muted)]">
              {share.kind === "video" ? (
                videoUrl ? (
                  // eslint-disable-next-line jsx-a11y/media-has-caption
                  <video controls playsInline src={videoUrl} className="w-full" />
                ) : (
                  <div className="grid aspect-[9/16] place-items-center">
                    <Loader2 className="size-6 animate-spin text-[var(--color-brand-blue)]" />
                  </div>
                )
              ) : loadingImage || !imageUrl ? (
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
                disabled={share.kind === "video" ? !videoBlob : !imageBlob}
                onClick={handleShare}
                className="inline-flex min-h-10 items-center gap-2 rounded-full bg-[var(--color-brand-blue)] px-4 text-xs font-semibold text-white disabled:opacity-50"
              >
                <Share2 className="size-3.5" />{" "}
                {share.kind === "video" ? "Share video" : "Share image"}
              </button>
              <a
                href={(share.kind === "video" ? videoUrl : imageUrl) ?? undefined}
                download={
                  share.kind === "video"
                    ? `sogp-learning-progress.${videoMimeType.includes("mp4") ? "mp4" : "webm"}`
                    : "sogp-learning-progress.png"
                }
                className={`inline-flex min-h-10 items-center gap-2 rounded-full border border-[var(--color-brand-blue)] px-4 text-xs font-semibold text-[var(--color-brand-blue)] ${(share.kind === "video" ? videoUrl : imageUrl) ? "" : "pointer-events-none opacity-50"
                  }`}
              >
                {share.kind === "video" ? "Download video" : "Download image"}
              </a>
              <button
                type="button"
                onClick={reset}
                className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[var(--color-line-strong)] px-4 text-xs font-semibold text-[var(--color-text-strong)]"
              >
                <RotateCcw className="size-3.5" />{" "}
                {share.kind === "video" ? "Record a different one" : "Write a different one"}
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
