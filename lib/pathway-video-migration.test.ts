import { describe, expect, test } from "vitest";

import {
  buildConfirmedGoogleDriveDownloadUrl,
  collectPathwayVideoSources,
  extractGoogleDriveFileId,
  parseGoogleDriveDownloadInterstitial,
} from "./pathway-video-migration";

describe("pathway video migration helpers", () => {
  test("extracts Google Drive file ids from preview and view urls", () => {
    expect(
      extractGoogleDriveFileId(
        "https://drive.google.com/file/d/1YQDScqhn7CLszSwSNX5L3oMqIjJVehv4/preview",
      ),
    ).toBe("1YQDScqhn7CLszSwSNX5L3oMqIjJVehv4");

    expect(
      extractGoogleDriveFileId(
        "https://drive.google.com/file/d/1YQDScqhn7CLszSwSNX5L3oMqIjJVehv4/view?usp=sharing",
      ),
    ).toBe("1YQDScqhn7CLszSwSNX5L3oMqIjJVehv4");

    expect(
      extractGoogleDriveFileId(
        "https://drive.google.com/uc?export=download&id=1YQDScqhn7CLszSwSNX5L3oMqIjJVehv4",
      ),
    ).toBe("1YQDScqhn7CLszSwSNX5L3oMqIjJVehv4");
  });

  test("parses the Drive virus-scan interstitial and builds the confirm download url", () => {
    const html = `
      <html>
        <body>
          <p class="uc-warning-subcaption">
            <span class="uc-name-size">
              <a href="/open?id=1jVbUwpPqsdS7vPuK9bxDHymu_dDNB2Vm">The Most Important Question.mp4</a>
            </span>
          </p>
          <form id="download-form" action="https://drive.usercontent.google.com/download" method="get">
            <input type="hidden" name="id" value="1jVbUwpPqsdS7vPuK9bxDHymu_dDNB2Vm">
            <input type="hidden" name="export" value="download">
            <input type="hidden" name="confirm" value="t">
            <input type="hidden" name="uuid" value="2134f1b5-c6ca-4abe-981b-d4ba827496d5">
          </form>
        </body>
      </html>
    `;

    const parsed = parseGoogleDriveDownloadInterstitial(html);

    expect(parsed).toEqual({
      actionUrl: "https://drive.usercontent.google.com/download",
      filename: "The Most Important Question.mp4",
      hiddenFields: {
        confirm: "t",
        export: "download",
        id: "1jVbUwpPqsdS7vPuK9bxDHymu_dDNB2Vm",
        uuid: "2134f1b5-c6ca-4abe-981b-d4ba827496d5",
      },
    });

    expect(buildConfirmedGoogleDriveDownloadUrl(parsed!)).toBe(
      "https://drive.usercontent.google.com/download?id=1jVbUwpPqsdS7vPuK9bxDHymu_dDNB2Vm&export=download&confirm=t&uuid=2134f1b5-c6ca-4abe-981b-d4ba827496d5",
    );
  });

  test("collects only Drive-backed pathway videos for migration", () => {
    const videos = collectPathwayVideoSources();

    expect(videos).toHaveLength(15);
    expect(videos.every((video) => video.previewUrl.includes("/preview"))).toBe(
      true,
    );
    expect(videos.some((video) => video.seriesSlug === "gospel-answers-critical-series")).toBe(
      false,
    );
    expect(videos[0]).toMatchObject({
      pathway: "questions",
      seriesSlug: "most-important-questions-series",
      videoId: "most-important-questions-1",
      driveFileId: "1jVbUwpPqsdS7vPuK9bxDHymu_dDNB2Vm",
      customId:
        "pathway-videos/questions/most-important-questions-series/most-important-questions-1",
    });
    expect(
      videos.find((video) => video.videoId === "gods-purpose-02"),
    ).toMatchObject({
      pathway: "purpose",
      driveFileId: "1YQDScqhn7CLszSwSNX5L3oMqIjJVehv4",
    });
  });
});
