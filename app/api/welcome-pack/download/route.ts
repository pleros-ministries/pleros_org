import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { Readable } from "node:stream";

import { NextResponse } from "next/server";

import { getAppSession } from "@/lib/app-session";
import {
  getWelcomePackContentType,
  getWelcomePackDownloadFilename,
  resolveWelcomePackDownloadFilePath,
} from "@/lib/welcome-pack-download";

export const runtime = "nodejs";

async function hasWelcomePackAccess(): Promise<boolean> {
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

export async function GET() {
  if (!(await hasWelcomePackAccess())) {
    return NextResponse.json(
      { error: "Log in to access the welcome pack download." },
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
