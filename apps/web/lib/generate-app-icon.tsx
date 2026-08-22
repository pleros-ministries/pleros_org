import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { ImageResponse } from "next/og";

let cachedLogoSrc: string | null = null;

async function getLogoSrc() {
  if (cachedLogoSrc) return cachedLogoSrc;
  const buffer = await readFile(join(process.cwd(), "app/apple-icon.png"));
  cachedLogoSrc = `data:image/png;base64,${buffer.toString("base64")}`;
  return cachedLogoSrc;
}

export async function createAppIconResponse(size: number) {
  const logoSrc = await getLogoSrc();
  const markSize = Math.round(size * 0.62);

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
        <img src={logoSrc} width={markSize} height={markSize} alt="" />
      </div>
    ),
    { width: size, height: size },
  );
}
