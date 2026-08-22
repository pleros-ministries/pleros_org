import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const alt = "Pleros Ministries and Missions";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const LOGO_WIDTH = 345;
const LOGO_HEIGHT = 177;
const LOGO_DISPLAY_WIDTH = 620;
const LOGO_DISPLAY_HEIGHT = Math.round(
  (LOGO_DISPLAY_WIDTH / LOGO_WIDTH) * LOGO_HEIGHT,
);

export default async function OpengraphImage() {
  const logoBuffer = await readFile(
    join(process.cwd(), "public/brand/white-logotype.png"),
  );
  const logoSrc = `data:image/png;base64,${logoBuffer.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#011585",
        }}
      >
        <img
          src={logoSrc}
          width={LOGO_DISPLAY_WIDTH}
          height={LOGO_DISPLAY_HEIGHT}
          alt=""
        />
      </div>
    ),
    { ...size },
  );
}
