import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { LEARNING_PROGRESS_SHARE_SANS as SANS, LEARNING_PROGRESS_SHARE_SERIF as SERIF } from "./learning-progress-share";

/**
 * Fonts and images for the server-rendered SOGP share cards (`ImageResponse`).
 * Server-only: reads from `public/` on disk and caches each load per instance.
 */

function loadDataUri(relativePath: string): Promise<string> {
  return readFile(join(process.cwd(), relativePath)).then(
    (buffer) => `data:image/png;base64,${buffer.toString("base64")}`,
  );
}

let patternDataUriPromise: Promise<string> | null = null;
export function getPatternDataUri(): Promise<string> {
  if (!patternDataUriPromise) {
    patternDataUriPromise = loadDataUri("public/site/sogp/share-card-pattern.png");
  }
  return patternDataUriPromise;
}

let darkLogoDataUriPromise: Promise<string> | null = null;
export function getDarkLogoDataUri(): Promise<string> {
  if (!darkLogoDataUriPromise) {
    darkLogoDataUriPromise = loadDataUri("public/site/sogp/pleros-logo-dark.png");
  }
  return darkLogoDataUriPromise;
}

let whiteLogoDataUriPromise: Promise<string> | null = null;
export function getWhiteLogoDataUri(): Promise<string> {
  if (!whiteLogoDataUriPromise) {
    whiteLogoDataUriPromise = loadDataUri("public/site/sogp/pleros-logo-white.png");
  }
  return whiteLogoDataUriPromise;
}

function loadFontFile(relativePath: string): Promise<Buffer> {
  return readFile(join(process.cwd(), relativePath));
}

let cardFontsPromise: ReturnType<typeof buildCardFonts> | null = null;
function buildCardFonts() {
  return Promise.all([
    loadFontFile("public/fonts/sogp-share/Poppins-Medium.ttf"),
    loadFontFile("public/fonts/sogp-share/Poppins-SemiBold.ttf"),
    loadFontFile("public/fonts/sogp-share/Poppins-Bold.ttf"),
    loadFontFile("public/fonts/sogp-share/Newsreader-Medium.ttf"),
    loadFontFile("public/fonts/sogp-share/Newsreader-MediumItalic.ttf"),
  ]).then(
    ([poppinsMedium, poppinsSemiBold, poppinsBold, newsreaderMedium, newsreaderMediumItalic]) => [
      { name: SANS, data: poppinsMedium, weight: 500 as const, style: "normal" as const },
      { name: SANS, data: poppinsSemiBold, weight: 600 as const, style: "normal" as const },
      { name: SANS, data: poppinsBold, weight: 700 as const, style: "normal" as const },
      { name: SERIF, data: newsreaderMedium, weight: 500 as const, style: "normal" as const },
      { name: SERIF, data: newsreaderMediumItalic, weight: 500 as const, style: "italic" as const },
    ],
  );
}
export function getCardFonts() {
  if (!cardFontsPromise) {
    cardFontsPromise = buildCardFonts();
  }
  return cardFontsPromise;
}
