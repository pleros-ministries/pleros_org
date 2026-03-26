import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

import { UTApi } from "uploadthing/server";

import {
  buildConfirmedGoogleDriveDownloadUrl,
  collectPathwayVideoSources,
  parseGoogleDriveDownloadInterstitial,
  type PathwayVideoSource,
} from "../lib/pathway-video-migration";

type MigrationScope = "all" | "questions" | "purpose";

type ResolvedPathwayVideoSource = PathwayVideoSource & {
  downloadUrl: string;
  sourceFilename: string;
};

type UploadManifestEntry = ResolvedPathwayVideoSource & {
  uploadedUrl: string | null;
  uploadedKey: string | null;
};

const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36";

function loadLocalEnvFiles() {
  for (const fileName of [".env.local", ".env"]) {
    const filePath = join(process.cwd(), fileName);
    if (!existsSync(filePath)) {
      continue;
    }

    const source = readFileSync(filePath, "utf8");
    for (const line of source.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) {
        continue;
      }

      const separatorIndex = trimmed.indexOf("=");
      if (separatorIndex < 0) {
        continue;
      }

      const key = trimmed.slice(0, separatorIndex).trim();
      if (!key || process.env[key]) {
        continue;
      }

      let value = trimmed.slice(separatorIndex + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }

      process.env[key] = value;
    }
  }
}

function getArgValue(flag: string): string | null {
  const direct = process.argv.find((arg) => arg.startsWith(`${flag}=`));
  if (direct) {
    return direct.slice(flag.length + 1);
  }

  const index = process.argv.indexOf(flag);
  if (index >= 0) {
    return process.argv[index + 1] ?? null;
  }

  return null;
}

function getScope(): MigrationScope {
  const scope = getArgValue("--scope");
  if (scope === "questions" || scope === "purpose" || scope === "all") {
    return scope;
  }

  return "all";
}

function getLimit(): number | null {
  const raw = getArgValue("--limit");
  if (!raw) {
    return null;
  }

  const parsed = Number.parseInt(raw, 10);
  if (Number.isNaN(parsed) || parsed < 1) {
    throw new Error(`Invalid --limit value: ${raw}`);
  }

  return parsed;
}

function getManifestPath(): string {
  return (
    getArgValue("--manifest") ??
    join(process.cwd(), "tmp", "pathway-video-uploadthing-manifest.json")
  );
}

function filterByScope(
  videos: PathwayVideoSource[],
  scope: MigrationScope,
): PathwayVideoSource[] {
  if (scope === "all") {
    return videos;
  }

  return videos.filter((video) => video.pathway === scope);
}

function readExistingManifest(manifestPath: string): UploadManifestEntry[] {
  if (!existsSync(manifestPath)) {
    return [];
  }

  try {
    return JSON.parse(readFileSync(manifestPath, "utf8")) as UploadManifestEntry[];
  } catch (error) {
    throw new Error(
      `Could not read existing manifest at ${manifestPath}: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
}

function writeManifest(manifestPath: string, entries: UploadManifestEntry[]) {
  writeFileSync(manifestPath, `${JSON.stringify(entries, null, 2)}\n`, "utf8");
}

async function resolveGoogleDriveDownloadSource(
  source: PathwayVideoSource,
): Promise<ResolvedPathwayVideoSource> {
  const initialUrl = `https://drive.google.com/uc?export=download&id=${source.driveFileId}`;
  const response = await fetch(initialUrl, {
    headers: { "user-agent": USER_AGENT },
    redirect: "follow",
  });

  const contentType = response.headers.get("content-type") ?? "";

  if (!contentType.includes("text/html")) {
    return {
      ...source,
      downloadUrl: response.url,
      sourceFilename: source.suggestedFilename,
    };
  }

  const html = await response.text();
  const interstitial = parseGoogleDriveDownloadInterstitial(html);

  if (!interstitial) {
    throw new Error(
      `Could not parse the Google Drive download page for "${source.title}" (${source.driveFileId}).`,
    );
  }

  return {
    ...source,
    downloadUrl: buildConfirmedGoogleDriveDownloadUrl(interstitial),
    sourceFilename: interstitial.filename ?? source.suggestedFilename,
  };
}

async function uploadResolvedSource(
  utapi: UTApi,
  source: ResolvedPathwayVideoSource,
): Promise<UploadManifestEntry> {
  const result = await utapi.uploadFilesFromUrl(
    {
      url: source.downloadUrl,
      name: source.sourceFilename,
      customId: source.customId,
    },
    { concurrency: 1 },
  );

  if (result.error || !result.data) {
    throw new Error(
      `UploadThing failed for "${source.title}": ${
        result.error?.message ?? "Unknown upload error"
      }`,
    );
  }

  return {
    ...source,
    uploadedUrl: result.data.ufsUrl,
    uploadedKey: result.data.key,
  };
}

async function main() {
  loadLocalEnvFiles();

  const execute = process.argv.includes("--execute");
  const scope = getScope();
  const limit = getLimit();
  const manifestPath = getManifestPath();

  const allVideos = collectPathwayVideoSources();
  const scopedVideos = filterByScope(allVideos, scope);
  const selectedVideos =
    limit == null ? scopedVideos : scopedVideos.slice(0, limit);

  if (selectedVideos.length === 0) {
    throw new Error("No pathway videos matched the selected scope.");
  }

  console.log(
    `Preparing ${selectedVideos.length} pathway videos for UploadThing (${scope} scope).`,
  );

  const resolvedSources: ResolvedPathwayVideoSource[] = [];
  for (const [index, source] of selectedVideos.entries()) {
    console.log(
      `[resolve ${index + 1}/${selectedVideos.length}] ${source.title} (${source.seriesTitle})`,
    );
    resolvedSources.push(await resolveGoogleDriveDownloadSource(source));
  }

  const manifestDir = dirname(manifestPath);
  mkdirSync(manifestDir, { recursive: true });
  const existingManifestEntries = readExistingManifest(manifestPath);
  const existingManifestByCustomId = new Map(
    existingManifestEntries.map((entry) => [entry.customId, entry]),
  );

  if (!execute) {
    const manifest: UploadManifestEntry[] = resolvedSources.map(
      (source) =>
        existingManifestByCustomId.get(source.customId) ?? {
          ...source,
          uploadedUrl: null,
          uploadedKey: null,
        },
    );
    writeManifest(manifestPath, manifest);
    console.log(`Dry run complete. Manifest written to ${manifestPath}`);
    console.log("Run again with --execute to perform the uploads.");
    return;
  }

  if (!process.env.UPLOADTHING_TOKEN) {
    throw new Error(
      "UPLOADTHING_TOKEN is missing. Add it to .env or .env.local before running with --execute.",
    );
  }

  const utapi = new UTApi({
    token: process.env.UPLOADTHING_TOKEN,
  });

  const uploadedEntries: UploadManifestEntry[] = [...existingManifestEntries];
  for (const [index, source] of resolvedSources.entries()) {
    const existingEntry = existingManifestByCustomId.get(source.customId);
    if (existingEntry?.uploadedUrl && existingEntry.uploadedKey) {
      console.log(
        `[skip ${index + 1}/${resolvedSources.length}] ${source.title} already uploaded`,
      );
      continue;
    }

    console.log(
      `[upload ${index + 1}/${resolvedSources.length}] ${source.title} -> ${source.customId}`,
    );
    const uploadedEntry = await uploadResolvedSource(utapi, source);
    const existingIndex = uploadedEntries.findIndex(
      (entry) => entry.customId === source.customId,
    );

    if (existingIndex >= 0) {
      uploadedEntries[existingIndex] = uploadedEntry;
    } else {
      uploadedEntries.push(uploadedEntry);
    }

    writeManifest(manifestPath, uploadedEntries);
  }

  writeManifest(manifestPath, uploadedEntries);
  console.log(`Upload complete. Manifest written to ${manifestPath}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
