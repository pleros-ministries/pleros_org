"use client";

import { useEffect, useState } from "react";
import { Loader2, Share2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  PRE_SOGP_SHARE_PLATFORMS,
  buildPreSogpShareIntentUrl,
  type PreSogpShareIntentPlatform,
} from "@/lib/sogp/share";
import { buildSogpWeekCertificateShareMessage } from "@/lib/sogp/week-certificates";

import { trackSogpEvent } from "./sogp-analytics";
import { ShareIntentButtons } from "./share-intent-buttons";

const INTENT_PLATFORMS = PRE_SOGP_SHARE_PLATFORMS.filter(
  (platform): platform is PreSogpShareIntentPlatform =>
    platform !== "copy" && platform !== "native",
);

export type ShareableWeekCertificate = {
  week: number;
  title: string;
  verificationCode: string;
};

export function ShareWeekCertificateDialog({
  certificate,
  shareUrl,
  open,
  onOpenChange,
}: {
  certificate: ShareableWeekCertificate;
  /** The learner's referral link, or the public SOGP page. */
  shareUrl: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [imageBlob, setImageBlob] = useState<Blob | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    let objectUrl: string | null = null;
    fetch(`/api/sogp/week-certificates/${encodeURIComponent(certificate.verificationCode)}/image`, {
      credentials: "same-origin",
    })
      .then((response) => {
        if (!response.ok) throw new Error("Image unavailable");
        return response.blob();
      })
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setImageBlob(blob);
        setImageUrl(objectUrl);
      })
      .catch(() => {
        if (!cancelled) setError("Your certificate image could not be loaded. Try again.");
      });
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      setImageBlob(null);
      setImageUrl(null);
      setError(null);
    };
  }, [open, certificate.verificationCode]);

  const fileName = `sogp-week-${certificate.week}-certificate.png`;
  const message = buildSogpWeekCertificateShareMessage({
    week: certificate.week,
    title: certificate.title,
  });
  const hrefs = Object.fromEntries(
    INTENT_PLATFORMS.map((platform) => [
      platform,
      buildPreSogpShareIntentUrl({ platform, postUrl: shareUrl, message }),
    ]),
  ) as Record<PreSogpShareIntentPlatform, string>;

  async function handleShare() {
    if (!imageBlob) return;
    trackSogpEvent("sogp_week_certificate_shared", { week: certificate.week });
    const file = new File([imageBlob], fileName, {
      type: imageBlob.type || "image/png",
    });
    try {
      if (
        typeof navigator !== "undefined" &&
        "canShare" in navigator &&
        navigator.canShare({ files: [file] })
      ) {
        await navigator.share({ files: [file], text: message, url: shareUrl });
        return;
      }
    } catch (shareError) {
      if ((shareError as DOMException)?.name === "AbortError") return;
    }
    // Fall back to a plain download when file sharing isn't supported.
    const anchor = document.createElement("a");
    anchor.href = imageUrl ?? "";
    anchor.download = fileName;
    anchor.click();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] gap-2.5 overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Share your Week {certificate.week} certificate</DialogTitle>
          <DialogDescription>
            Celebrate with friends and invite them to the next cohort.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-line)] bg-[var(--color-surface-muted)]">
            {imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- a local blob URL
              <img
                src={imageUrl}
                alt={`Week ${certificate.week} certificate: ${certificate.title}`}
                className="w-full"
              />
            ) : (
              <div className="grid aspect-square place-items-center">
                {error ? null : (
                  <Loader2 className="size-6 animate-spin text-[var(--color-brand-blue)]" />
                )}
              </div>
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
              download={fileName}
              className={`inline-flex min-h-10 items-center gap-2 rounded-full border border-[var(--color-brand-blue)] px-4 text-xs font-semibold text-[var(--color-brand-blue)] ${imageUrl ? "" : "pointer-events-none opacity-50"}`}
            >
              Download image
            </a>
          </div>
          <div className="grid gap-2 border-t border-[var(--color-line)] pt-4">
            <p className="text-xs font-semibold text-[var(--color-text-muted)]">
              Invite others to join SOGP with your link
            </p>
            <ShareIntentButtons
              hrefs={hrefs}
              copyValue={shareUrl}
              nativeShare={{
                title: `SOGP Week ${certificate.week} certificate`,
                text: message,
                url: shareUrl,
              }}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
