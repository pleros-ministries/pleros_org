export type PathwayKey = "questions" | "purpose" | "fulfil";

export type WelcomePackDismissedState = {
  status: "dismissed";
  updatedAt: string;
};

export type WelcomePackCompletedState = {
  status: "completed";
  email: string;
  updatedAt: string;
};

export type WelcomePackState =
  | WelcomePackDismissedState
  | WelcomePackCompletedState;

export const WELCOME_PACK_STORAGE_KEY = "pleros.welcome-pack.state";

export function getNextCarouselIndex(current: number, total: number): number {
  if (total <= 0) {
    return 0;
  }

  return (current + 1) % total;
}

export function readWelcomePackState(raw: string | null): WelcomePackState | null {
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<WelcomePackState>;

    if (parsed.status === "dismissed" && typeof parsed.updatedAt === "string") {
      return {
        status: "dismissed",
        updatedAt: parsed.updatedAt,
      };
    }

    if (
      parsed.status === "completed" &&
      typeof parsed.updatedAt === "string" &&
      typeof parsed.email === "string"
    ) {
      return {
        status: "completed",
        email: parsed.email,
        updatedAt: parsed.updatedAt,
      };
    }

    return null;
  } catch {
    return null;
  }
}

export function serializeWelcomePackState(state: WelcomePackState): string {
  return JSON.stringify(state);
}

export function shouldShowWelcomePackModal(raw: string | null): boolean {
  return readWelcomePackState(raw)?.status !== "completed";
}

export type DownloadPayload = {
  fileName: string;
  content: string;
};

export function buildWelcomePackDownloads(email: string): DownloadPayload[] {
  return [
    {
      fileName: "pleros-welcome-pack-ebook-1.txt",
      content: [
        "Pleros welcome pack ebook 1",
        `Requested by: ${email}`,
        "Placeholder content for local homepage flow.",
      ].join("\n"),
    },
    {
      fileName: "pleros-welcome-pack-ebook-2.txt",
      content: [
        "Pleros welcome pack ebook 2",
        `Requested by: ${email}`,
        "Placeholder content for local homepage flow.",
      ].join("\n"),
    },
  ];
}
