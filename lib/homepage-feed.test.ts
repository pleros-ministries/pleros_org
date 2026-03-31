import { afterEach, describe, expect, test, vi } from "vitest";

import {
  getLatestInstagramPosts,
  getLatestInstagramPostsWithDiagnostics,
  mapInstagramProfileEdgesToPosts,
} from "./homepage-feed";

describe("homepage feed", () => {
  afterEach(() => {
    vi.restoreAllMocks();
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
});
