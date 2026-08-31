export function getPreparationRequirements(input: {
  lessonComplete: boolean;
  prayerWatchComplete: boolean;
}) {
  return [input.lessonComplete, input.prayerWatchComplete];
}

export type SogpLessonMedia = {
  kind: "video" | "embed" | "external";
  src: string;
};

export function classifySogpLessonMediaUrl(url: string): SogpLessonMedia {
  if (url.startsWith("/")) return { kind: "video", src: url };

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { kind: "external", src: url };
  }

  const isDirectVideo =
    /\.(mp4|webm|ogg)$/i.test(parsed.pathname) ||
    (parsed.hostname.endsWith(".ufs.sh") && parsed.pathname.startsWith("/f/"));
  if (isDirectVideo) return { kind: "video", src: url };

  const isYouTubeEmbed =
    ["www.youtube.com", "youtube.com", "www.youtube-nocookie.com"].includes(
      parsed.hostname,
    ) && parsed.pathname.startsWith("/embed/");
  const isGoogleDrivePreview =
    parsed.hostname === "drive.google.com" &&
    parsed.pathname.startsWith("/file/d/") &&
    parsed.pathname.endsWith("/preview");

  if (isYouTubeEmbed || isGoogleDrivePreview) {
    return { kind: "embed", src: url };
  }

  return { kind: "external", src: url };
}

type SogpDayRequirementInput =
  | {
      kind: "weekday";
      prayerWatchComplete: boolean;
      assessmentComplete: boolean;
    }
  | {
      kind: "weekend";
      prayerWatchComplete: boolean;
    }
  | {
      kind: "review";
      prayerWatchComplete: boolean;
      reviewComplete: boolean;
    };

export function getSogpDayRequirements(input: SogpDayRequirementInput) {
  if (input.kind === "weekday") {
    return [input.prayerWatchComplete, input.assessmentComplete];
  }
  if (input.kind === "review") {
    return [input.prayerWatchComplete, input.reviewComplete];
  }
  return [input.prayerWatchComplete];
}

const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function isRealDateKey(value: string) {
  if (!DATE_KEY_PATTERN.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year!, month! - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month! - 1 &&
    date.getUTCDate() === day
  );
}

export function isDateWithinSogpWindow({
  dateKey,
  startDateKey,
  endDateKey,
  todayKey,
}: {
  dateKey: string;
  startDateKey: string;
  endDateKey: string;
  todayKey: string;
}) {
  return (
    isRealDateKey(dateKey) &&
    dateKey >= startDateKey &&
    dateKey <= endDateKey &&
    dateKey <= todayKey
  );
}

export function isReviewCompletionSource(
  value: unknown,
): value is "live" | "recording" {
  return value === "live" || value === "recording";
}
