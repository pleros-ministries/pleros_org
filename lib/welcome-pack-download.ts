import path from "node:path";

export const DEFAULT_WELCOME_PACK_FILE_PATH =
  "private/welcome-pack/pleros-welcome-pack.pdf";
export const DEFAULT_WELCOME_PACK_DOWNLOAD_FILENAME =
  "welcome-to-purpose-Pleros.pdf";

type WelcomePackEnvironment = {
  readonly [key: string]: string | undefined;
  WELCOME_PACK_FILE_PATH?: string;
  WELCOME_PACK_DOWNLOAD_FILENAME?: string;
};

export function resolveWelcomePackDownloadFilePath(
  env: WelcomePackEnvironment,
  cwd = process.cwd(),
): string {
  const configuredPath = env.WELCOME_PACK_FILE_PATH?.trim();
  const filePath = configuredPath || DEFAULT_WELCOME_PACK_FILE_PATH;

  return path.isAbsolute(filePath)
    ? filePath
    : path.join(/* turbopackIgnore: true */ cwd, filePath);
}

export function getWelcomePackDownloadFilename(
  env: WelcomePackEnvironment,
): string {
  const filename = env.WELCOME_PACK_DOWNLOAD_FILENAME?.trim();

  return filename || DEFAULT_WELCOME_PACK_DOWNLOAD_FILENAME;
}

export function getWelcomePackContentType(filename: string): string {
  const extension = path.extname(filename).toLowerCase();

  switch (extension) {
    case ".pdf":
      return "application/pdf";
    case ".zip":
      return "application/zip";
    case ".epub":
      return "application/epub+zip";
    default:
      return "application/octet-stream";
  }
}

export function buildWelcomePackDownloadUrl(
  siteUrl: string,
  token?: string,
): string {
  const url = new URL("/api/welcome-pack/download", siteUrl);

  if (token) {
    url.searchParams.set("token", token);
  }

  return url.toString();
}
