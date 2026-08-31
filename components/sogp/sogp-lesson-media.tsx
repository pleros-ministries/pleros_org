import { ExternalLinkIcon } from "lucide-react";

import { classifySogpLessonMediaUrl } from "@/lib/sogp/journey";

export function SogpLessonMedia({
  title,
  url,
}: {
  title: string;
  url: string;
}) {
  const media = classifySogpLessonMediaUrl(url);
  const mediaClassName =
    "aspect-video w-full rounded-[var(--radius-sm)] bg-black";

  if (media.kind === "video") {
    return (
      <video
        controls
        playsInline
        preload="metadata"
        src={media.src}
        className={mediaClassName}
      />
    );
  }

  if (media.kind === "embed") {
    return (
      <iframe
        src={media.src}
        title={`${title} video`}
        className={mediaClassName}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
      />
    );
  }

  return (
    <a
      href={media.src}
      target="_blank"
      rel="noreferrer"
      className="inline-flex min-h-11 w-fit items-center gap-2 rounded-full border border-[var(--color-brand-blue)] px-5 text-sm font-semibold text-[var(--color-brand-blue)]"
    >
      Open teaching video
      <ExternalLinkIcon className="size-4" aria-hidden="true" />
    </a>
  );
}
