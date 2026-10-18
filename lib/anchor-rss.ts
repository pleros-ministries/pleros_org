import { cacheLife } from "next/cache";

export const ANCHOR_RSS_URL =
  "https://anchor.fm/s/10db96b2c/podcast/rss" as const;

export type RssEpisode = {
  guid: string;
  title: string;
  /** Spotify/Anchor episode page — navigate here */
  link: string;
  /** Direct .mp3 URL — use for <audio> and download */
  audioUrl: string;
  /** Human-readable duration, e.g. "00:18:10" */
  duration: string;
  pubDate: string;
  /** ISO date string, e.g. "2026-06-23" */
  isoDate: string;
  /** Episode artwork (falls back to show artwork) */
  imageUrl: string;
  description: string;
  episodeNumber: number | null;
};

/** Strip CDATA wrappers and HTML tags from RSS text content. */
function cleanText(raw: string): string {
  return raw
    .replace(/<!\[CDATA\[([\s\S]*?)]]>/g, "$1")
    .replace(/<[^>]+>/g, "")
    .trim();
}

function extractTag(xml: string, tag: string): string {
  const match = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\/${tag}>`, "i"));
  return match ? cleanText(match[1]) : "";
}

function extractAttr(xml: string, tag: string, attr: string): string {
  const match = xml.match(new RegExp(`<${tag}[^>]*\\s${attr}="([^"]*)"`, "i"));
  return match ? match[1] : "";
}

function parseIsoDate(pubDate: string): string {
  try {
    return new Date(pubDate).toISOString().slice(0, 10);
  } catch {
    return "";
  }
}

function parseItems(xml: string): RssEpisode[] {
  const showImage = extractAttr(xml, "itunes:image", "href");

  // Split by <item> boundaries
  const rawItems = xml.split(/<item>/).slice(1);

  return rawItems.map((block) => {
    const enclosureUrl = extractAttr(block, "enclosure", "url");
    const imageUrl =
      extractAttr(block, "itunes:image", "href") || showImage;
    const pubDate = extractTag(block, "pubDate");
    const epNumRaw = extractTag(block, "itunes:episode");

    return {
      guid: extractTag(block, "guid"),
      title: extractTag(block, "title"),
      link: extractTag(block, "link"),
      audioUrl: enclosureUrl,
      duration: extractTag(block, "itunes:duration"),
      pubDate,
      isoDate: parseIsoDate(pubDate),
      imageUrl,
      description: extractTag(block, "description"),
      episodeNumber: epNumRaw ? parseInt(epNumRaw, 10) : null,
    };
  });
}

// Last good list on this instance, served if the feed fails (failures are never cached).
let lastGoodEpisodes: RssEpisode[] = [];

export async function fetchAnchorEpisodes(): Promise<RssEpisode[]> {
  try {
    const episodes = await loadAnchorEpisodes();
    lastGoodEpisodes = episodes;
    return episodes;
  } catch (err) {
    console.error("[anchor-rss] error:", err);
    return lastGoodEpisodes;
  }
}

/** Cache Components: the feed is cached for five minutes, so pages can prerender it. */
async function loadAnchorEpisodes(): Promise<RssEpisode[]> {
  "use cache";
  cacheLife({ stale: 300, revalidate: 300, expire: 3600 });
  const res = await fetch(ANCHOR_RSS_URL);
  if (!res.ok) throw new Error(`fetch failed: ${res.status}`);
  return parseItems(await res.text());
}
