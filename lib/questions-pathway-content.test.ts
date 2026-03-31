import { describe, expect, test } from "vitest";

import {
  getQuestionsSeriesPage,
  questionsPathwaySeries,
  questionsPathwayHero,
  questionsSeriesPages,
} from "./questions-pathway-content";

describe("questions pathway content", () => {
  test("keeps the questions hero messaging focused on doubt and gospel clarity", () => {
    expect(questionsPathwayHero.title).toBe("Find Answers");
    expect(questionsPathwayHero.description).toBe(
      "Do you have doubts about God and/or the Gospel?",
    );
    expect(questionsPathwayHero.illustrationSrc).toBe(
      "/site/home/assets/questions-pathway/question-header-icon.png",
    );
  });

  test("surfaces the three featured question series in the figma order", () => {
    expect(
      questionsPathwaySeries.map(({ title, thumbnailSrc, playIconSrc, href }) => ({
        title,
        thumbnailSrc,
        playIconSrc,
        href,
      })),
    ).toEqual([
      {
        title: "Most Important Questions Series",
        thumbnailSrc:
          "/site/home/assets/questions-pathway/thumbnails/most-important-questions-series.png",
        playIconSrc:
          "/site/home/assets/questions-pathway/video-circle-icon.png",
        href: "/questions/most-important-questions-series",
      },
      {
        title: "Gospel Answers Series (Simple Version)",
        thumbnailSrc:
          "/site/home/assets/questions-pathway/thumbnails/gospel-answers-simple-series.png",
        playIconSrc:
          "/site/home/assets/questions-pathway/video-circle-icon.png",
        href: "/questions/gospel-answers-simple-series",
      },
      {
        title: "Gospel Answers Series (Critical Version)",
        thumbnailSrc:
          "/site/home/assets/questions-pathway/thumbnails/gospel-answers-critical-series.png",
        playIconSrc:
          "/site/home/assets/questions-pathway/video-circle-icon.png",
        href: "/questions/gospel-answers-critical-series",
      },
    ]);
  });

  test("defines dedicated sub-pages with recovered video links for the Most Important Questions and Gospel Answers Simple series", () => {
    expect(
      questionsSeriesPages.map(({ slug, title, videos }) => ({
        slug,
        title,
        videoCount: videos.length,
      })),
    ).toEqual([
      {
        slug: "most-important-questions-series",
        title: "Most Important Questions Series",
        videoCount: 5,
      },
      {
        slug: "gospel-answers-simple-series",
        title: "Gospel Answers Series (Simple Version)",
        videoCount: 4,
      },
      {
        slug: "gospel-answers-critical-series",
        title: "Gospel Answers Series (Critical Version)",
        videoCount: 2,
      },
    ]);
    expect(getQuestionsSeriesPage("most-important-questions-series")?.title).toBe(
      "Most Important Questions Series",
    );
    expect(
      getQuestionsSeriesPage("most-important-questions-series")?.videos.map(
        ({ title, href, thumbnailSrc }) => ({ title, href, thumbnailSrc }),
      ),
    ).toEqual([
      {
        title: "The Most Important Question",
        href: "https://drive.google.com/file/d/1jVbUwpPqsdS7vPuK9bxDHymu_dDNB2Vm/preview",
        thumbnailSrc:
          "https://lh3.googleusercontent.com/d/1jVbUwpPqsdS7vPuK9bxDHymu_dDNB2Vm=w1200",
      },
      {
        title: "Baptism of the Holy Ghost",
        href: "https://drive.google.com/file/d/1XMNOYIeoM2zrdU8de0Hya9jUSCJbH-5P/preview",
        thumbnailSrc:
          "https://lh3.googleusercontent.com/d/1XMNOYIeoM2zrdU8de0Hya9jUSCJbH-5P=w1200",
      },
      {
        title: "Healing",
        href: "https://drive.google.com/file/d/1TM2HYuYZi8ktffPxKh6dMfprJX1LgdJC/preview",
        thumbnailSrc:
          "https://lh3.googleusercontent.com/d/1TM2HYuYZi8ktffPxKh6dMfprJX1LgdJC=w1200",
      },
      {
        title: "Local Church",
        href: "https://drive.google.com/file/d/113AZNjAi1ljK2vlWExEHcYASWhGokcrF/preview",
        thumbnailSrc:
          "https://lh3.googleusercontent.com/d/113AZNjAi1ljK2vlWExEHcYASWhGokcrF=w1200",
      },
      {
        title: "Salvation",
        href: "https://drive.google.com/file/d/1YJZKpT6vDrikezN3eexDYTjKTtpaPB-W/preview",
        thumbnailSrc:
          "https://lh3.googleusercontent.com/d/1YJZKpT6vDrikezN3eexDYTjKTtpaPB-W=w1200",
      },
    ]);
    expect(
      getQuestionsSeriesPage("gospel-answers-simple-series")?.videos.map(
        ({ title, href, thumbnailSrc }) => ({ title, href, thumbnailSrc }),
      ),
    ).toEqual([
      {
        title: "Gospel Answers Series 1",
        href: "https://drive.google.com/file/d/1_T-BOBV5dUDKszvuTCVlmkxKWEU_9bG_/preview",
        thumbnailSrc:
          "https://lh3.googleusercontent.com/d/1_T-BOBV5dUDKszvuTCVlmkxKWEU_9bG_=w1200",
      },
      {
        title: "Gospel Answers Series 2",
        href: "https://drive.google.com/file/d/1QrHO7kV0bJeZWkMAf7wXYLWP-T-5q3U5/preview",
        thumbnailSrc:
          "https://lh3.googleusercontent.com/d/1QrHO7kV0bJeZWkMAf7wXYLWP-T-5q3U5=w1200",
      },
      {
        title: "Gospel Answers Series 3",
        href: "https://drive.google.com/file/d/1DjEVKJJ90iMKPW3AW7U6cLoqaNx3NozJ/preview",
        thumbnailSrc:
          "https://lh3.googleusercontent.com/d/1DjEVKJJ90iMKPW3AW7U6cLoqaNx3NozJ=w1200",
      },
      {
        title: "Gospel Answers Series 4",
        href: "https://drive.google.com/file/d/1vnC3dObvaJ90o3IZp0LXKth1K7krvZ7n/preview",
        thumbnailSrc:
          "https://lh3.googleusercontent.com/d/1vnC3dObvaJ90o3IZp0LXKth1K7krvZ7n=w1200",
      },
    ]);
    expect(getQuestionsSeriesPage("missing-series")).toBeNull();
  });
});
