import path from "node:path";
import { describe, expect, test } from "vitest";

import {
  DEFAULT_WELCOME_PACK_DOWNLOAD_FILENAME,
  DEFAULT_WELCOME_PACK_FILE_PATH,
  buildWelcomePackDownloadUrl,
  getWelcomePackContentType,
  getWelcomePackDownloadFilename,
  resolveWelcomePackDownloadFilePath,
} from "./welcome-pack-download";

describe("welcome pack download helpers", () => {
  test("resolves the default private welcome pack file path", () => {
    expect(
      resolveWelcomePackDownloadFilePath({} as NodeJS.ProcessEnv, "/repo"),
    ).toBe(path.join("/repo", DEFAULT_WELCOME_PACK_FILE_PATH));
  });

  test("allows an explicit absolute welcome pack file path", () => {
    expect(
      resolveWelcomePackDownloadFilePath(
        { WELCOME_PACK_FILE_PATH: "/secure/book.pdf" } as NodeJS.ProcessEnv,
        "/repo",
      ),
    ).toBe("/secure/book.pdf");
  });

  test("builds a signed download URL for email and browser handoff", () => {
    expect(
      buildWelcomePackDownloadUrl("https://pleros.org/some-path", "token.123"),
    ).toBe("https://pleros.org/api/welcome-pack/download?token=token.123");
  });

  test("uses a stable public filename and content type for downloads", () => {
    expect(getWelcomePackDownloadFilename({} as NodeJS.ProcessEnv)).toBe(
      DEFAULT_WELCOME_PACK_DOWNLOAD_FILENAME,
    );
    expect(getWelcomePackContentType("welcome.pdf")).toBe("application/pdf");
    expect(getWelcomePackContentType("welcome.zip")).toBe("application/zip");
  });
});
