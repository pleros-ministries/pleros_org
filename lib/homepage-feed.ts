const YOUTUBE_CHANNEL_RSS_URL =
  "https://www.youtube.com/feeds/videos.xml?channel_id=UCamQ1mD2w-TOwliMk88CuwA";

const INSTAGRAM_PROFILE_URL =
  "https://www.instagram.com/api/v1/users/web_profile_info/?username=pleros_org";

export type YoutubeEpisode = {
  id: string;
  title: string;
  href: string;
  thumbnailUrl: string;
  publishedAt: string;
};

export type InstagramPost = {
  id: string;
  title: string;
  href: string;
  imageUrl: string;
  profileImageUrl: string | null;
  takenAt: number;
};

export type InstagramReelPreview = {
  id: string;
  href: string;
  imageUrl: string;
  handle: string;
  postedAtLabel: string;
  likesLabel: string;
  title: string;
  excerpt: string;
};

export type InstagramFeedDiagnostics = {
  ok: boolean;
  status: number | null;
  contentType: string | null;
  payloadUser: boolean;
  edgeCount: number;
  reelCount: number;
  postsCount: number;
  error: string | null;
  bodyPreview: string | null;
};

function createInstagramFeedDiagnostics(
  overrides: Partial<InstagramFeedDiagnostics> = {},
): InstagramFeedDiagnostics {
  return {
    ok: false,
    status: null,
    contentType: null,
    payloadUser: false,
    edgeCount: 0,
    reelCount: 0,
    postsCount: 0,
    error: null,
    bodyPreview: null,
    ...overrides,
  };
}

function decodeXmlValue(value: string) {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&apos;", "'")
    .replaceAll("&#39;", "'");
}

function extractXmlValue(source: string, pattern: RegExp) {
  const match = source.match(pattern);
  return match?.[1] ? decodeXmlValue(match[1].trim()) : null;
}

function stripCaption(caption: string | null) {
  if (!caption) {
    return "Latest update from Pleros Ministries.";
  }

  const normalized = caption.replace(/\s+/g, " ").trim();

  if (normalized.length <= 88) {
    return normalized;
  }

  return `${normalized.slice(0, 85).trimEnd()}...`;
}

function normalizeText(value: string | null) {
  return value?.replace(/\s+/g, " ").trim() ?? "";
}

function extractMetaValue(source: string, property: string) {
  const patterns = [
    new RegExp(
      `<meta\\s+(?:property|name)="${property}"\\s+content="([^"]+)"`,
      "i",
    ),
    new RegExp(
      `<meta\\s+content="([^"]+)"\\s+(?:property|name)="${property}"`,
      "i",
    ),
  ];

  for (const pattern of patterns) {
    const match = source.match(pattern);

    if (match?.[1]) {
      return decodeXmlValue(match[1].trim());
    }
  }

  return null;
}

function extractInstagramCaption(description: string | null, ogTitle: string | null) {
  const decodedDescription = normalizeText(description);
  const decodedTitle = normalizeText(ogTitle);

  const descriptionMatch = decodedDescription.match(/:\s*"(.+)"\.?$/);

  if (descriptionMatch?.[1]) {
    return normalizeText(descriptionMatch[1]);
  }

  const titleMatch = decodedTitle.match(/on Instagram:\s*"(.+)"$/);

  if (titleMatch?.[1]) {
    return normalizeText(titleMatch[1]);
  }

  return "";
}

function trimSentence(value: string, maxLength: number) {
  if (value.length <= maxLength) {
    return value;
  }

  const sentence = value.match(/^(.+?[.!?])(?:\s|$)/)?.[1]?.trim();

  if (sentence && sentence.length <= maxLength) {
    return sentence;
  }

  return `${value.slice(0, maxLength - 3).trimEnd()}...`;
}

function extractInstagramId(href: string) {
  return href.match(/\/(?:reel|p)\/([^/?#]+)/)?.[1] ?? null;
}

export function extractInstagramReelPreview(
  source: string,
  href: string,
): InstagramReelPreview | null {
  const imageUrl = extractMetaValue(source, "og:image");
  const ogTitle = extractMetaValue(source, "og:title");
  const description = extractMetaValue(source, "description");
  const id = extractInstagramId(href);

  if (!imageUrl || !id) {
    return null;
  }

  const normalizedDescription = normalizeText(description);
  const handle =
    normalizedDescription.match(/-\s+([a-zA-Z0-9._]+)\s+on\s+/)?.[1] ??
    "pleros_org";
  const postedAtLabel =
    normalizedDescription.match(/\s+on\s+([^:]+):/)?.[1]?.trim() ?? "Instagram";
  const likesLabel =
    normalizedDescription.match(/^([\d,]+\s+likes)/)?.[1] ?? "Instagram Reel";
  const caption = extractInstagramCaption(description, ogTitle);
  const shortCaption = extractInstagramCaption(null, ogTitle) || caption;
  const title =
    trimSentence(shortCaption, 76) || "Watch the latest reel from Pleros.";
  const excerpt = trimSentence(caption, 140) || title;

  return {
    id,
    href,
    imageUrl,
    handle,
    postedAtLabel,
    likesLabel,
    title,
    excerpt,
  };
}

export async function getInstagramReelPreviews(
  urls: readonly string[],
): Promise<InstagramReelPreview[]> {
  const previews = await Promise.all(
    urls.map(async (href) => {
      try {
        const response = await fetch(href, {
          next: { revalidate: 1800 },
          headers: {
            "user-agent":
              "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
            accept: "text/html,*/*;q=0.8",
            referer: "https://www.instagram.com/pleros_org/",
          },
        });

        if (!response.ok) {
          return null;
        }

        const html = await response.text();
        return extractInstagramReelPreview(html, href);
      } catch {
        return null;
      }
    }),
  );

  return previews.flatMap((preview) => (preview ? [preview] : []));
}

export async function getLatestYoutubeEpisode(): Promise<YoutubeEpisode | null> {
  try {
    const response = await fetch(YOUTUBE_CHANNEL_RSS_URL, {
      next: { revalidate: 1800 },
      headers: {
        "user-agent": "Mozilla/5.0",
      },
    });

    if (!response.ok) {
      return null;
    }

    const xml = await response.text();
    const entries = [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)];

    for (const entry of entries) {
      const block = entry[1];

      if (!block) {
        continue;
      }

      const href = extractXmlValue(block, /<link rel="alternate" href="([^"]+)"/);

      if (!href || href.includes("/shorts/")) {
        continue;
      }

      const id = extractXmlValue(block, /<yt:videoId>([^<]+)<\/yt:videoId>/);
      const title = extractXmlValue(block, /<title>([^<]+)<\/title>/);
      const publishedAt = extractXmlValue(block, /<published>([^<]+)<\/published>/);
      const thumbnailUrl = extractXmlValue(
        block,
        /<media:thumbnail url="([^"]+)"/,
      );

      if (!id || !title || !publishedAt || !thumbnailUrl) {
        continue;
      }

      return {
        id,
        title,
        href,
        thumbnailUrl,
        publishedAt,
      };
    }
  } catch {
    return null;
  }

  return null;
}

type InstagramProfileEdge = {
  node?: {
    id?: string;
    __typename?: string;
    shortcode?: string;
    display_url?: string;
    thumbnail_src?: string;
    taken_at_timestamp?: number;
    edge_media_to_caption?: {
      edges?: Array<{
        node?: {
          text?: string;
        };
      }>;
    };
  };
};

export function mapInstagramProfileEdgesToPosts(
  edges: InstagramProfileEdge[],
  profileImageUrl: string | null = null,
): InstagramPost[] {
  return edges.flatMap((edge) => {
    const node = edge.node;

    if (!node?.id || !node.shortcode || node.__typename !== "GraphVideo") {
      return [];
    }

    const imageUrl = node.thumbnail_src ?? node.display_url;

    if (!imageUrl) {
      return [];
    }

    const caption = node.edge_media_to_caption?.edges?.[0]?.node?.text ?? null;

    return [
      {
        id: node.id,
        title: stripCaption(caption),
        href: `https://www.instagram.com/reel/${node.shortcode}/`,
        imageUrl,
        profileImageUrl,
        takenAt: node.taken_at_timestamp ?? 0,
      },
    ];
  });
}

export async function getLatestInstagramPostsWithDiagnostics(): Promise<{
  posts: InstagramPost[];
  diagnostics: InstagramFeedDiagnostics;
}> {
  try {
    const response = await fetch(INSTAGRAM_PROFILE_URL, {
      cache: "no-store",
      headers: {
        "user-agent": "Mozilla/5.0",
        "x-ig-app-id": "936619743392459",
        referer: "https://www.instagram.com/pleros_org/",
        accept: "*/*",
      },
    });

    const contentType = response.headers.get("content-type");
    const rawBody = await response.text();

    if (!response.ok) {
      return {
        posts: [],
        diagnostics: createInstagramFeedDiagnostics({
          ok: false,
          status: response.status,
          contentType,
          error: "non_ok_response",
          bodyPreview: rawBody.slice(0, 240),
        }),
      };
    }

    const payload = JSON.parse(rawBody) as {
      data?: {
        user?: {
          profile_pic_url?: string;
          profile_pic_url_hd?: string;
          edge_owner_to_timeline_media?: {
            edges?: InstagramProfileEdge[];
          };
        };
      };
    };

    const user = payload.data?.user;
    const edges = user?.edge_owner_to_timeline_media?.edges ?? [];
    const profileImageUrl = user?.profile_pic_url_hd ?? user?.profile_pic_url ?? null;
    const posts = mapInstagramProfileEdgesToPosts(edges, profileImageUrl).slice(0, 5);
    const reelCount = edges.filter((edge) => edge.node?.__typename === "GraphVideo").length;

    return {
      posts,
      diagnostics: createInstagramFeedDiagnostics({
        ok: true,
        status: response.status,
        contentType,
        payloadUser: Boolean(user),
        edgeCount: edges.length,
        reelCount,
        postsCount: posts.length,
      }),
    };
  } catch (error) {
    return {
      posts: [],
      diagnostics: createInstagramFeedDiagnostics({
        error: error instanceof Error ? error.message : "unknown_error",
      }),
    };
  }
}

export async function getLatestInstagramPosts(): Promise<InstagramPost[]> {
  const result = await getLatestInstagramPostsWithDiagnostics();
  return result.posts;
}
