import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { ImageResponse } from "next/og";

import { getOpenSogpCohort } from "@/lib/db/queries/sogp";
import { getPublicPreparationPost } from "@/lib/db/queries/sogp-journey";

export const runtime = "nodejs";
export const alt = "Pre-SOGP preparation";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;

export default async function OpengraphImage({
  params,
}: {
  params: Promise<{ date: string }>;
}) {
  const { date } = await params;
  const cohort = DATE_KEY.test(date) ? await getOpenSogpCohort() : null;
  const post = cohort ? await getPublicPreparationPost(cohort, date) : null;

  const logoBuffer = await readFile(
    join(process.cwd(), "public/brand/white-logotype.png"),
  );
  const logoSrc = `data:image/png;base64,${logoBuffer.toString("base64")}`;

  const heading = post ? `Day ${post.dayNumber} · Pre-SOGP` : "Pre-SOGP";
  const title = post?.title ?? "A free journey to discover God's purpose";

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 80,
          backgroundColor: "#011585",
        }}
      >
        <img src={logoSrc} width={300} height={154} alt="" />
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <span
            style={{
              color: "#c9f24d",
              fontSize: 30,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: 2,
            }}
          >
            {heading}
          </span>
          <span
            style={{
              color: "white",
              fontSize: 60,
              fontWeight: 700,
              lineHeight: 1.15,
            }}
          >
            {title}
          </span>
        </div>
      </div>
    ),
    { ...size },
  );
}
