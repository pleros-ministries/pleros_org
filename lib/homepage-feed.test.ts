import { describe, expect, test } from "vitest";

import { mapInstagramProfileEdgesToPosts } from "./homepage-feed";

describe("homepage feed", () => {
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
});
