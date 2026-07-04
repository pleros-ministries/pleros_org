import { NextRequest, NextResponse } from "next/server";

const ALLOWED_HOST = "anchor.fm";
const ALLOWED_PATH_PREFIX = "/s/10db96b2c/podcast/play/";

function sanitizeFilename(value: string) {
  const clean = value
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .toLowerCase();

  return clean ? `${clean}.mp3` : "pleros-podcast.mp3";
}

function isAllowedPodcastUrl(value: string) {
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      url.hostname === ALLOWED_HOST &&
      url.pathname.startsWith(ALLOWED_PATH_PREFIX)
    );
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest) {
  const sourceUrl = request.nextUrl.searchParams.get("url");
  const title = request.nextUrl.searchParams.get("title") ?? "pleros-podcast";

  if (!sourceUrl || !isAllowedPodcastUrl(sourceUrl)) {
    return NextResponse.json({ error: "Invalid podcast download URL." }, { status: 400 });
  }

  const upstream = await fetch(sourceUrl);

  if (!upstream.ok || !upstream.body) {
    return NextResponse.json(
      { error: "Podcast download is unavailable." },
      { status: upstream.status || 502 },
    );
  }

  const filename = sanitizeFilename(title);
  const headers = new Headers();
  headers.set(
    "Content-Disposition",
    `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
  );
  headers.set("Content-Type", upstream.headers.get("content-type") ?? "audio/mpeg");

  const contentLength = upstream.headers.get("content-length");
  if (contentLength) {
    headers.set("Content-Length", contentLength);
  }

  return new NextResponse(upstream.body, { headers });
}
