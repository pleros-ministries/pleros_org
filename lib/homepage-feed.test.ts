import { afterEach, describe, expect, test, vi } from "vitest";

import {
  getLatestInstagramPosts,
  getLatestInstagramPostsWithDiagnostics,
  getLatestYoutubeVideos,
  mapInstagramProfileEdgesToPosts,
} from "./homepage-feed";

describe("homepage feed", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  test("keeps only reels when mapping instagram profile media", () => {
    const posts = mapInstagramProfileEdgesToPosts([
      {
        node: {
          id: "image-1",
          __typename: "GraphImage",
          shortcode: "IMAGEONE",
          display_url: "https://example.com/image.jpg",
          taken_at_timestamp: 100,
          edge_media_to_caption: {
            edges: [{ node: { text: "Static image post" } }],
          },
        },
      },
      {
        node: {
          id: "video-1",
          __typename: "GraphVideo",
          shortcode: "VIDEOONE",
          thumbnail_src: "https://example.com/video-one.jpg",
          taken_at_timestamp: 200,
          edge_media_to_caption: {
            edges: [{ node: { text: "First reel" } }],
          },
        },
      },
      {
        node: {
          id: "video-2",
          __typename: "GraphVideo",
          shortcode: "VIDEOTWO",
          thumbnail_src: "https://example.com/video-two.jpg",
          taken_at_timestamp: 300,
          edge_media_to_caption: {
            edges: [{ node: { text: "Second reel" } }],
          },
        },
      },
    ], "https://example.com/profile.jpg");

    expect(posts).toEqual([
      {
        id: "video-1",
        title: "First reel",
        href: "https://www.instagram.com/reel/VIDEOONE/",
        imageUrl: "https://example.com/video-one.jpg",
        profileImageUrl: "https://example.com/profile.jpg",
        takenAt: 200,
      },
      {
        id: "video-2",
        title: "Second reel",
        href: "https://www.instagram.com/reel/VIDEOTWO/",
        imageUrl: "https://example.com/video-two.jpg",
        profileImageUrl: "https://example.com/profile.jpg",
        takenAt: 300,
      },
    ]);
  });


  test("returns fetch diagnostics when Instagram profile data is available", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({
        "content-type": "application/json; charset=utf-8",
      }),
      text: async () => JSON.stringify({
        data: {
          user: {
            profile_pic_url: "https://example.com/profile.jpg",
            edge_owner_to_timeline_media: {
              edges: [
                {
                  node: {
                    id: "video-1",
                    __typename: "GraphVideo",
                    shortcode: "VIDEOONE",
                    thumbnail_src: "https://example.com/video-one.jpg",
                    taken_at_timestamp: 200,
                    edge_media_to_caption: {
                      edges: [{ node: { text: "First reel" } }],
                    },
                  },
                },
                {
                  node: {
                    id: "image-1",
                    __typename: "GraphImage",
                    shortcode: "IMAGEONE",
                    display_url: "https://example.com/image.jpg",
                    taken_at_timestamp: 100,
                    edge_media_to_caption: {
                      edges: [{ node: { text: "Static post" } }],
                    },
                  },
                },
              ],
            },
          },
        },
      }),
    } as Response);

    const result = await getLatestInstagramPostsWithDiagnostics();

    expect(result.posts).toHaveLength(1);
    expect(result.diagnostics).toMatchObject({
      ok: true,
      status: 200,
      edgeCount: 2,
      reelCount: 1,
      postsCount: 1,
      error: null,
      payloadUser: true,
    });
    expect(result.diagnostics.contentType).toContain("application/json");
  });

  test("captures non-ok Instagram responses in diagnostics", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: false,
      status: 429,
      headers: new Headers({
        "content-type": "text/plain",
      }),
      text: async () => "rate limited by upstream",
    } as Response);

    const result = await getLatestInstagramPostsWithDiagnostics();

    expect(result.posts).toEqual([]);
    expect(result.diagnostics).toMatchObject({
      ok: false,
      status: 429,
      edgeCount: 0,
      reelCount: 0,
      postsCount: 0,
      error: "non_ok_response",
      bodyPreview: "rate limited by upstream",
    });
  });

  test("requests Instagram profile data without reusing stale cached responses", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue({
        ok: true,
        json: async () => ({
          data: {
            user: {
              profile_pic_url: null,
              edge_owner_to_timeline_media: {
                edges: [],
              },
            },
          },
        }),
      } as Response);

    await getLatestInstagramPosts();

    expect(fetchSpy).toHaveBeenCalledWith(
      "https://www.instagram.com/api/v1/users/web_profile_info/?username=pleros_org",
      expect.objectContaining({
        cache: "no-store",
      }),
    );
  });

  test("filters YouTube API results to short videos only", async () => {
    vi.stubEnv("YOUTUBE_API_KEY", "test-key");
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          items: [
            {
              snippet: {
                resourceId: { videoId: "short-video" },
              },
            },
            {
              snippet: {
                resourceId: { videoId: "long-video" },
              },
            },
          ],
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          items: [
            {
              id: "short-video",
              snippet: {
                title: "A short teaching clip",
                publishedAt: "2026-07-03T05:01:17+00:00",
                thumbnails: {
                  high: { url: "https://example.com/short.jpg" },
                },
              },
              contentDetails: { duration: "PT45S" },
            },
            {
              id: "long-video",
              snippet: {
                title: "A full teaching episode",
                publishedAt: "2026-07-02T05:01:17+00:00",
                thumbnails: {
                  high: { url: "https://example.com/long.jpg" },
                },
              },
              contentDetails: { duration: "PT22M" },
            },
          ],
        }),
      } as Response);

    await expect(getLatestYoutubeVideos(5)).resolves.toEqual([
      {
        id: "short-video",
        title: "A short teaching clip",
        href: "https://www.youtube.com/shorts/short-video",
        thumbnailUrl: "https://example.com/short.jpg",
        publishedAt: "2026-07-03T05:01:17+00:00",
      },
    ]);
  });

  test("does not render normal YouTube watch URLs as Shorts in the RSS fallback", async () => {
    vi.stubEnv("YOUTUBE_API_KEY", "");
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      text: async () => `
        <feed>
          <entry>
            <yt:videoId>deNcj4iR7Ok</yt:videoId>
            <title>Our Righteous Nature in Christ (Part 17)</title>
            <link rel="alternate" href="https://www.youtube.com/watch?v=deNcj4iR7Ok"/>
            <published>2026-07-03T05:01:17+00:00</published>
            <media:thumbnail url="https://i1.ytimg.com/vi/deNcj4iR7Ok/hqdefault.jpg"/>
          </entry>
        </feed>
      `,
    } as Response);

    await expect(getLatestYoutubeVideos(5)).resolves.toEqual([]);
  });
});
