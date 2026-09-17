import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { ImageResponse } from "next/og";
import { NextResponse } from "next/server";

import { getAppSession } from "@/lib/app-session";
import { getLearningProgressShareForOwner } from "@/lib/db/queries/sogp-learning-progress-share";

export const runtime = "nodejs";

const SIZE = { width: 1080, height: 1080 };

let bannerDataUriPromise: Promise<string> | null = null;
function getBannerDataUri(): Promise<string> {
  if (!bannerDataUriPromise) {
    bannerDataUriPromise = readFile(
      join(process.cwd(), "public/site/sogp/quote-banner.jpg"),
    ).then(
      (buffer) => `data:image/jpeg;base64,${buffer.toString("base64")}`,
    );
  }
  return bannerDataUriPromise;
}

let logoDataUriPromise: Promise<string> | null = null;
function getLogoDataUri(): Promise<string> {
  if (!logoDataUriPromise) {
    logoDataUriPromise = readFile(
      join(process.cwd(), "public/brand/white-logotype.png"),
    ).then(
      (buffer) => `data:image/png;base64,${buffer.toString("base64")}`,
    );
  }
  return logoDataUriPromise;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const shareId = Number(id);
  if (!Number.isInteger(shareId)) {
    return NextResponse.json({ error: "Invalid share" }, { status: 400 });
  }

  const session = await getAppSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const share = await getLearningProgressShareForOwner(
    shareId,
    session.user.id,
  );
  if (!share) {
    return NextResponse.json({ error: "Share not found" }, { status: 404 });
  }

  const [bannerSrc, logoSrc] = await Promise.all([
    getBannerDataUri(),
    getLogoDataUri(),
  ]);

  const heading =
    share.track === "pre_sogp"
      ? "PRE-SOGP LEARNING PROGRESS"
      : "SOGP LEARNING PROGRESS";

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          backgroundImage: `url(${bannerSrc})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- satori (ImageResponse) requires a plain <img>, not next/image */}
        <img src={logoSrc} width={200} height={103} alt="" />

        <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
          <span
            style={{
              color: "white",
              fontSize: 26,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: 2,
            }}
          >
            {heading}
          </span>
          <span
            style={{
              color: "rgba(255,255,255,0.92)",
              fontSize: 40,
              fontStyle: "italic",
              lineHeight: 1.35,
            }}
          >
            &ldquo;{share.quote}&rdquo;
          </span>
          <span
            style={{
              alignSelf: "flex-end",
              color: "white",
              fontSize: 28,
              fontWeight: 700,
            }}
          >
            &hellip; {share.authorName}
          </span>
        </div>

        <span
          style={{
            alignSelf: "center",
            color: "rgba(255,255,255,0.85)",
            fontSize: 22,
          }}
        >
          www.pleros.org/sogp
        </span>
      </div>
    ),
    { ...SIZE },
  );
}
