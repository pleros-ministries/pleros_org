import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { Readable } from "node:stream";

import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { getAppSession } from "@/lib/app-session";
import {
  getWelcomeAccessSecret,
  parseWelcomeAccessToken,
  readWelcomeAccessToken,
  WELCOME_ACCESS_COOKIE_NAME,
} from "@/lib/welcome-access";
import {
  getWelcomePackContentType,
  getWelcomePackDownloadFilename,
  resolveWelcomePackDownloadFilePath,
} from "@/lib/welcome-pack-download";

export const runtime = "nodejs";

async function hasWelcomePackAccess(request: NextRequest): Promise<boolean> {
  const token = request.nextUrl.searchParams.get("token");

  if (token && parseWelcomeAccessToken(token, getWelcomeAccessSecret(process.env))) {
    return true;
  }

  const cookieStore = await cookies();
  const welcomeAccess = readWelcomeAccessToken(
    cookieStore.get(WELCOME_ACCESS_COOKIE_NAME)?.value,
    process.env,
  );

  if (welcomeAccess) {
    return true;
  }

  const appSession = await getAppSession();

  return Boolean(appSession);
}

function buildAttachmentHeaders(filename: string, size: number): Headers {
  const headers = new Headers();
  headers.set("Content-Type", getWelcomePackContentType(filename));
  headers.set("Content-Length", size.toString());
  headers.set(
    "Content-Disposition",
    `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
  );

  return headers;
}

export async function GET(request: NextRequest) {
  if (!(await hasWelcomePackAccess(request))) {
    return NextResponse.json(
      { error: "Enter your email to access the welcome pack download." },
      { status: 401 },
    );
  }

  const filePath = resolveWelcomePackDownloadFilePath(process.env);
  const filename = getWelcomePackDownloadFilename(process.env);

  try {
    const fileStat = await stat(filePath);

    if (!fileStat.isFile()) {
      throw new Error("Welcome pack path is not a file.");
    }

    const stream = Readable.toWeb(createReadStream(filePath));

    return new NextResponse(stream as BodyInit, {
      headers: buildAttachmentHeaders(filename, fileStat.size),
    });
  } catch (error) {
    console.error("Welcome pack download unavailable:", error);

    return NextResponse.json(
      {
        error:
          "The welcome pack download is not available yet. Please try again shortly.",
      },
      { status: 404 },
    );
  }
}
