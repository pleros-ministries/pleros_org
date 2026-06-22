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
      questionsPathwaySeries.map(
        ({ title, thumbnailSrc, playIconSrc, href, comingSoon, description }) => ({
          title,
          thumbnailSrc,
          playIconSrc,
          href,
          comingSoon,
          description,
        }),
      ),
    ).toEqual([
      {
        title: "Most Important Questions Series",
        description:
          "Five short teachings on Salvation, the Holy Spirit, Healing, and the Local Church",
        thumbnailSrc:
          "/site/home/assets/questions-pathway/thumbnails/most-important-questions-series.png",
        playIconSrc:
          "/site/home/assets/questions-pathway/video-circle-icon.png",
        href: "/questions/most-important-questions-series",
        comingSoon: undefined,
      },
      {
        title: "Gospel Answers Series (Simple Version)",
        description:
          "Twelve simple videos with clear answers to common Gospel questions",
        thumbnailSrc:
          "/site/home/assets/questions-pathway/thumbnails/gospel-answers-simple-series.png",
        playIconSrc:
          "/site/home/assets/questions-pathway/video-circle-icon.png",
        href: "/questions/gospel-answers-simple-series",
        comingSoon: undefined,
      },
      {
        title: "Gospel Answers Series (Critical Version)",
        thumbnailSrc:
          "/site/home/assets/questions-pathway/thumbnails/gospel-answers-critical-series.png",
        playIconSrc:
          "/site/home/assets/questions-pathway/video-circle-icon.png",
        href: "/questions/gospel-answers-critical-series",
        comingSoon: true,
        description: "Coming soon",
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
        videoCount: 12,
      },
      {
        slug: "gospel-answers-critical-series",
        title: "Gospel Answers Series (Critical Version)",
        videoCount: 0,
      },
    ]);
    expect(getQuestionsSeriesPage("gospel-answers-critical-series")).toMatchObject({
      comingSoon: true,
      videos: [],
    });
    expect(getQuestionsSeriesPage("most-important-questions-series")?.title).toBe(
      "Most Important Questions Series",
    );
    expect(
      getQuestionsSeriesPage("most-important-questions-series")?.videos.map(
        ({ id, title, href, thumbnailSrc }) => ({ id, title, href, thumbnailSrc }),
      ),
    ).toEqual([
      {
        id: "most-important-questions-the-most-important-question",
        title: "The Most Important Question",
        href: "https://jqhxdgo3h8.ufs.sh/f/3pDCanj1aBdfta6XuYhFFL76Gq3MOQHCESRrgtDzuyhNbK5e",
        thumbnailSrc:
          "https://lh3.googleusercontent.com/d/1jVbUwpPqsdS7vPuK9bxDHymu_dDNB2Vm=w1200",
      },
      {
        id: "most-important-questions-baptism-of-the-holy-ghost",
        title: "Baptism of the Holy Ghost",
        href: "https://jqhxdgo3h8.ufs.sh/f/3pDCanj1aBdfuZScfHmQzaCIkhDQEen5XpA3wrS7H2tcmqVN",
        thumbnailSrc:
          "https://lh3.googleusercontent.com/d/1XMNOYIeoM2zrdU8de0Hya9jUSCJbH-5P=w1200",
      },
      {
        id: "most-important-questions-healing",
        title: "Healing",
        href: "https://jqhxdgo3h8.ufs.sh/f/3pDCanj1aBdfKwy4WGtrd2xJU9QLNTm65YMRqw3cOiAhp4fB",
        thumbnailSrc:
          "https://lh3.googleusercontent.com/d/1TM2HYuYZi8ktffPxKh6dMfprJX1LgdJC=w1200",
      },
      {
        id: "most-important-questions-local-church",
        title: "Local Church",
        href: "https://jqhxdgo3h8.ufs.sh/f/3pDCanj1aBdfWwAauEIfjIcB25NqgLY6upabUDOvQ4TwdCt7",
        thumbnailSrc:
          "https://lh3.googleusercontent.com/d/113AZNjAi1ljK2vlWExEHcYASWhGokcrF=w1200",
      },
      {
        id: "most-important-questions-salvation",
        title: "Salvation",
        href: "https://jqhxdgo3h8.ufs.sh/f/3pDCanj1aBdftSn3y8FFL76Gq3MOQHCESRrgtDzuyhNbK5eP",
        thumbnailSrc:
          "https://lh3.googleusercontent.com/d/1YJZKpT6vDrikezN3eexDYTjKTtpaPB-W=w1200",
      },
    ]);
    const simpleSeriesVideos =
      getQuestionsSeriesPage("gospel-answers-simple-series")?.videos ?? [];
    expect(simpleSeriesVideos).toHaveLength(12);
    expect(simpleSeriesVideos[0]?.title).toBe("Gospel Answers Series 1");
    expect(simpleSeriesVideos.every((video) => video.href.includes("youtube.com/embed"))).toBe(
      true,
    );
    expect(
      simpleSeriesVideos.every((video) => video.thumbnailSrc.includes("i.ytimg.com")),
    ).toBe(true);
    expect(getQuestionsSeriesPage("missing-series")).toBeNull();
  });
});
