import { describe, expect, test } from "vitest";

import {
  purposePathwayHero,
  purposePathwayVideos,
} from "./purpose-pathway-content";

describe("purpose pathway content", () => {
  test("keeps the purpose hero aligned with the figma title and provided icon", () => {
    expect(purposePathwayHero.title).toBe("Discover Purpose");
    expect(purposePathwayHero.description).toBe(
      "Do you have doubts about God and/or the Gospel?",
    );
    expect(purposePathwayHero.illustrationSrc).toBe(
      "/site/home/assets/discover-pathway/discover-header-icon.svg",
    );
  });

  test("provides the recovered purpose series list with numbering 01 to 06 and Drive-backed thumbnails", () => {
    expect(
      purposePathwayVideos.map(({ title, thumbnailSrc, playIconSrc, href }) => ({
        title,
        thumbnailSrc,
        playIconSrc,
        href,
      })),
    ).toEqual([
      {
        title: "What is God's Purpose? (Part 1)",
        thumbnailSrc:
          "https://lh3.googleusercontent.com/d/1t3Q2A73kPwmo6azHNXImYCjCKTjhnA54=w1200",
        playIconSrc:
          "/site/home/assets/questions-pathway/video-circle-icon.png",
        href: "https://drive.google.com/file/d/1t3Q2A73kPwmo6azHNXImYCjCKTjhnA54/preview",
      },
      {
        title: "What is God's Purpose? (Part 2)",
        thumbnailSrc:
          "https://lh3.googleusercontent.com/d/1YQDScqhn7CLszSwSNX5L3oMqIjJVehv4=w1200",
        playIconSrc:
          "/site/home/assets/questions-pathway/video-circle-icon.png",
        href: "https://drive.google.com/file/d/1YQDScqhn7CLszSwSNX5L3oMqIjJVehv4/preview",
      },
      {
        title: "What is God's Purpose? (Part 3)",
        thumbnailSrc:
          "https://lh3.googleusercontent.com/d/1jyF70_5Iap2QGQFKhhoAXAqts8r3vZ2a=w1200",
        playIconSrc:
          "/site/home/assets/questions-pathway/video-circle-icon.png",
        href: "https://drive.google.com/file/d/1jyF70_5Iap2QGQFKhhoAXAqts8r3vZ2a/preview",
      },
      {
        title: "What is God's Purpose? (Part 4)",
        thumbnailSrc:
          "https://lh3.googleusercontent.com/d/1zJl9EMAekmK0NQi2S5q4n7B4dWCSaguB=w1200",
        playIconSrc:
          "/site/home/assets/questions-pathway/video-circle-icon.png",
        href: "https://drive.google.com/file/d/1zJl9EMAekmK0NQi2S5q4n7B4dWCSaguB/preview",
      },
      {
        title: "What is God's Purpose? (Part 5)",
        thumbnailSrc:
          "https://lh3.googleusercontent.com/d/1yFtmqVUiw2j5ck-DmhX5-CJkOhaCnsIL=w1200",
        playIconSrc:
          "/site/home/assets/questions-pathway/video-circle-icon.png",
        href: "https://drive.google.com/file/d/1yFtmqVUiw2j5ck-DmhX5-CJkOhaCnsIL/preview",
      },
      {
        title: "What is God's Purpose? (Part 6)",
        thumbnailSrc:
          "https://lh3.googleusercontent.com/d/1ByY9J8Yk29zal7KXi23hopyCejZR9Grk=w1200",
        playIconSrc:
          "/site/home/assets/questions-pathway/video-circle-icon.png",
        href: "https://drive.google.com/file/d/1ByY9J8Yk29zal7KXi23hopyCejZR9Grk/preview",
      },
    ]);
  });
});
