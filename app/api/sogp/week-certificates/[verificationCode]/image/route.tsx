import { ImageResponse } from "next/og";
import { NextResponse } from "next/server";

import { getAppSession } from "@/lib/app-session";
import { getSogpWeekCertificateForOwner } from "@/lib/db/queries/sogp-week-certificates";
import { getSogpLevel } from "@/lib/sogp/curriculum";
import {
  LEARNING_PROGRESS_SHARE_LIME as LIME,
  LEARNING_PROGRESS_SHARE_NAVY as NAVY,
  LEARNING_PROGRESS_SHARE_PADDING as PADDING,
  LEARNING_PROGRESS_SHARE_PATTERN_BLUE as PATTERN_BLUE,
  LEARNING_PROGRESS_SHARE_SANS as SANS,
  LEARNING_PROGRESS_SHARE_SERIF as SERIF,
  LEARNING_PROGRESS_SHARE_SKY as SKY,
} from "@/lib/sogp/learning-progress-share";
import {
  getCardFonts,
  getPatternDataUri,
  getWhiteLogoDataUri,
} from "@/lib/sogp/share-card-assets";
import { CardHeader, Divider, VisitBar } from "@/lib/sogp/share-card-parts";

export const runtime = "nodejs";

const SIZE = { width: 1080, height: 1080 };

function getTitleFontSize(title: string) {
  if (title.length <= 28) return 76;
  if (title.length <= 40) return 66;
  return 58;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ verificationCode: string }> },
) {
  const session = await getAppSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }
  const { verificationCode } = await params;
  const owned = await getSogpWeekCertificateForOwner(verificationCode, session.user.id);
  if (!owned) {
    return NextResponse.json({ error: "Certificate not found" }, { status: 404 });
  }

  const title = getSogpLevel(owned.week).title;
  const [patternSrc, logoSrc, fonts] = await Promise.all([
    getPatternDataUri(),
    getWhiteLogoDataUri(),
    getCardFonts(),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          boxSizing: "border-box",
          padding: PADDING,
          display: "flex",
          flexDirection: "column",
          backgroundImage: `url(${patternSrc})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundColor: PATTERN_BLUE,
          fontFamily: SANS,
        }}
      >
        <CardHeader tone="dark" logoSrc={logoSrc} />
        <div style={{ marginTop: 36, display: "flex", flexDirection: "column" }}>
          <Divider color="rgba(255, 255, 255, 0.35)" />
        </div>
        <div
          style={{
            flexGrow: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                width: 168,
                height: 168,
                flexShrink: 0,
                borderRadius: 999,
                backgroundColor: LIME,
                color: NAVY,
                boxShadow: "0 18px 40px rgba(4, 22, 92, 0.28)",
              }}
            >
              <span
                style={{
                  fontFamily: SANS,
                  fontWeight: 700,
                  fontSize: 22,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                }}
              >
                Week
              </span>
              <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: 72, lineHeight: 1 }}>
                {owned.week}
              </span>
            </div>
            <span
              style={{
                fontFamily: SANS,
                fontWeight: 600,
                fontSize: 26,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: SKY,
              }}
            >
              Week {owned.week} complete
            </span>
          </div>
          <h1
            style={{
              margin: "44px 0 0 0",
              fontFamily: SERIF,
              fontWeight: 500,
              fontSize: getTitleFontSize(title),
              lineHeight: 1.1,
              letterSpacing: "-0.012em",
              color: "#FFFFFF",
            }}
          >
            {title}
          </h1>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 40 }}>
            <span style={{ fontFamily: SANS, fontWeight: 600, fontSize: 34, lineHeight: 1.2, color: SKY }}>
              {owned.enrollment.name}
            </span>
            <span style={{ fontFamily: SANS, fontWeight: 500, fontSize: 24, lineHeight: 1.3, color: "rgba(255, 255, 255, 0.78)" }}>
              {owned.cohort.title}
            </span>
          </div>
        </div>
        <VisitBar
          bg={SKY}
          color={NAVY}
          marginTop={32}
          shadow="0 16px 36px rgba(4, 22, 92, 0.22)"
        />
      </div>
    ),
    {
      ...SIZE,
      fonts,
      headers: { "Cache-Control": "private, max-age=3600" },
    },
  );
}
