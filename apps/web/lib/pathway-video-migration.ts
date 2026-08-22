import {
  purposePathwayVideos,
  type PurposePathwayVideoItem,
} from "./purpose-pathway-content";
import {
  questionsSeriesPages,
  type QuestionsPathwayVideoItem,
} from "./questions-pathway-content";

export type PathwayVideoSource = {
  pathway: "questions" | "purpose";
  seriesSlug: string;
  seriesTitle: string;
  videoId: string;
  title: string;
  previewUrl: string;
  driveFileId: string;
  customId: string;
  suggestedFilename: string;
};

export type GoogleDriveDownloadInterstitial = {
  actionUrl: string;
  filename: string | null;
  hiddenFields: Record<string, string>;
};

function buildSuggestedFilename(seriesSlug: string, videoId: string): string {
  return `${seriesSlug}--${videoId}.mp4`;
}

function buildQuestionsVideoSource(
  seriesSlug: string,
  seriesTitle: string,
  video: QuestionsPathwayVideoItem,
): PathwayVideoSource | null {
  const driveFileId = extractGoogleDriveFileId(video.href);
  if (!driveFileId) {
    return null;
  }

  return {
    pathway: "questions",
    seriesSlug,
    seriesTitle,
    videoId: video.id,
    title: video.title,
    previewUrl: video.href,
    driveFileId,
    customId: `pathway-videos/questions/${seriesSlug}/${video.id}`,
    suggestedFilename: buildSuggestedFilename(seriesSlug, video.id),
  };
}

function buildPurposeVideoSource(
  video: PurposePathwayVideoItem,
): PathwayVideoSource | null {
  const driveFileId = extractGoogleDriveFileId(video.href);
  if (!driveFileId) {
    return null;
  }

  const seriesSlug = "discover-purpose";

  return {
    pathway: "purpose",
    seriesSlug,
    seriesTitle: "Discover Purpose",
    videoId: video.id,
    title: video.title,
    previewUrl: video.href,
    driveFileId,
    customId: `pathway-videos/purpose/${seriesSlug}/${video.id}`,
    suggestedFilename: buildSuggestedFilename(seriesSlug, video.id),
  };
}

export function collectPathwayVideoSources(): PathwayVideoSource[] {
  const questionVideos = questionsSeriesPages.flatMap((series) =>
    series.videos
      .map((video) =>
        buildQuestionsVideoSource(series.slug, series.title, video),
      )
      .filter((video): video is PathwayVideoSource => video !== null),
  );

  const purposeVideos = purposePathwayVideos
    .map((video) => buildPurposeVideoSource(video))
    .filter((video): video is PathwayVideoSource => video !== null);

  return [...questionVideos, ...purposeVideos];
}

export function extractGoogleDriveFileId(url: string): string | null {
  const filePathMatch = url.match(/\/file\/d\/([^/?]+)/);
  if (filePathMatch) {
    return filePathMatch[1];
  }

  try {
    const parsed = new URL(url);
    return parsed.searchParams.get("id");
  } catch {
    return null;
  }
}

export function parseGoogleDriveDownloadInterstitial(
  html: string,
): GoogleDriveDownloadInterstitial | null {
  const actionMatch = html.match(/<form[^>]+action="([^"]+)"/i);
  if (!actionMatch) {
    return null;
  }

  const hiddenFields = Object.fromEntries(
    [...html.matchAll(/<input[^>]+type="hidden"[^>]+name="([^"]+)"[^>]+value="([^"]*)"/gi)].map(
      (match) => [match[1], match[2]],
    ),
  );

  if (Object.keys(hiddenFields).length === 0) {
    return null;
  }

  const fileNameMatch = html.match(
    /<span class="uc-name-size">[\s\S]*?<a [^>]*>([^<]+)<\/a>/i,
  );

  return {
    actionUrl: actionMatch[1],
    filename: fileNameMatch?.[1] ?? null,
    hiddenFields,
  };
}

export function buildConfirmedGoogleDriveDownloadUrl(
  interstitial: GoogleDriveDownloadInterstitial,
): string {
  const url = new URL(interstitial.actionUrl);

  for (const [key, value] of Object.entries(interstitial.hiddenFields)) {
    url.searchParams.set(key, value);
  }

  return url.toString();
}
