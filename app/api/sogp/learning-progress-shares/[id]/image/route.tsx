import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { ImageResponse } from "next/og";
import type { ReactElement } from "react";
import { NextResponse } from "next/server";

import { getAppSession } from "@/lib/app-session";
import { getLearningProgressShareForOwner } from "@/lib/db/queries/sogp-learning-progress-share";
import {
  LEARNING_PROGRESS_SHARE_ACCENT_DARK as ACCENT_DARK,
  LEARNING_PROGRESS_SHARE_ACCENT_LIGHT as ACCENT_LIGHT,
  LEARNING_PROGRESS_SHARE_NAVY as NAVY,
  LEARNING_PROGRESS_SHARE_PADDING as PADDING,
  LEARNING_PROGRESS_SHARE_PATTERN_BLUE as PATTERN_BLUE,
  LEARNING_PROGRESS_SHARE_SANS as SANS,
  LEARNING_PROGRESS_SHARE_SERIF as SERIF,
  LEARNING_PROGRESS_SHARE_SKY as SKY,
  LEARNING_PROGRESS_SHARE_WHAT_I_LEARNT_GREEN as WHAT_I_LEARNT_GREEN,
  getLearningProgressDayText,
  getLearningProgressHeadline,
  getLearningProgressShareInitials,
  getLearningProgressTeachingLabel,
} from "@/lib/sogp/learning-progress-share";

export const runtime = "nodejs";

const SIZE = { width: 1080, height: 1080 };

function loadDataUri(relativePath: string): Promise<string> {
  return readFile(join(process.cwd(), relativePath)).then(
    (buffer) => `data:image/png;base64,${buffer.toString("base64")}`,
  );
}

let patternDataUriPromise: Promise<string> | null = null;
function getPatternDataUri(): Promise<string> {
  if (!patternDataUriPromise) {
    patternDataUriPromise = loadDataUri("public/site/sogp/share-card-pattern.png");
  }
  return patternDataUriPromise;
}

let darkLogoDataUriPromise: Promise<string> | null = null;
function getDarkLogoDataUri(): Promise<string> {
  if (!darkLogoDataUriPromise) {
    darkLogoDataUriPromise = loadDataUri("public/site/sogp/pleros-logo-dark.png");
  }
  return darkLogoDataUriPromise;
}

let whiteLogoDataUriPromise: Promise<string> | null = null;
function getWhiteLogoDataUri(): Promise<string> {
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
function getCardFonts() {
  if (!cardFontsPromise) {
    cardFontsPromise = buildCardFonts();
  }
  return cardFontsPromise;
}

type ShareRenderData = {
  quote: string;
  authorName: string;
  track: "sogp" | "pre_sogp";
  dayNumber: number | null;
  lessonTitle: string | null;
};

// Reflection quotes are capped at MAX_LEARNING_PROGRESS_CHARS (120) at
// submission time, so the top tiers below cover the real range; the last
// tier is only a safety net for shares created before that limit was
// lowered from 700 characters.
function getQuoteFontSize(quote: string, base: number, min: number): number {
  const length = quote.length;
  if (length <= 60) return base;
  if (length <= 90) return Math.round(base * 0.85);
  if (length <= 120) return Math.round(base * 0.72);
  return min;
}

function ArrowIcon({ color }: { color: string }) {
  return (
    <svg
      width={40}
      height={40}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1={4} y1={12} x2={19} y2={12} />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

function CardHeader({ tone, logoSrc }: { tone: "light" | "dark"; logoSrc: string }) {
  const color = tone === "light" ? NAVY : "#FFFFFF";
  return (
    <div
      style={{
        display: "flex",
        width: "100%",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: 32,
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          fontFamily: SANS,
          fontWeight: 700,
          fontSize: 30,
          lineHeight: 1.16,
          letterSpacing: "0.01em",
          textTransform: "uppercase",
          color,
        }}
      >
        <span>School of</span>
        <span>God&rsquo;s Purpose</span>
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element -- satori (ImageResponse) requires a plain <img>, not next/image */}
      <img src={logoSrc} height={72} alt="" />
    </div>
  );
}

function Divider({ color }: { color: string }) {
  return <div style={{ display: "flex", width: "100%", height: 1, background: color }} />;
}

function DayBadge({
  tone,
  dayText,
  teachingLabel,
  accent,
}: {
  tone: "light" | "dark";
  dayText: string;
  teachingLabel: string;
  accent: string;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
      <span
        style={{
          display: "flex",
          alignItems: "center",
          height: 66,
          padding: "0 34px",
          borderRadius: 999,
          backgroundColor: tone === "light" ? NAVY : SKY,
          color: tone === "light" ? "#FFFFFF" : NAVY,
          fontFamily: SANS,
          fontWeight: 700,
          fontSize: 30,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
        }}
      >
        {dayText}
      </span>
      <span
        style={{ display: "flex", width: 7, height: 7, borderRadius: 999, backgroundColor: accent }}
      />
      <span
        style={{
          fontFamily: SANS,
          fontWeight: 600,
          fontSize: 19,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          color: tone === "light" ? WHAT_I_LEARNT_GREEN : ACCENT_DARK,
        }}
      >
        {teachingLabel}
      </span>
    </div>
  );
}

function Headline({ tone, text, fontSize = 60 }: { tone: "light" | "dark"; text: string; fontSize?: number }) {
  return (
    <h1
      style={{
        margin: "18px 0 0 0",
        fontFamily: SERIF,
        fontWeight: 500,
        fontSize,
        lineHeight: 1.12,
        letterSpacing: "-0.012em",
        color: tone === "light" ? NAVY : "#FFFFFF",
      }}
    >
      {text}
    </h1>
  );
}

function WhatILearntRow({ labelColor, lineColor }: { labelColor: string; lineColor: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
      <span
        style={{
          fontFamily: SANS,
          fontWeight: 700,
          fontSize: 17,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          color: labelColor,
        }}
      >
        What I learnt
      </span>
      <span style={{ display: "flex", flexGrow: 1, height: 1, backgroundColor: lineColor }} />
    </div>
  );
}

function Avatar({ bg, color, initials }: { bg: string; color: string; initials: string }) {
  return (
    <span
      style={{
        display: "flex",
        width: 52,
        height: 52,
        flexShrink: 0,
        borderRadius: 999,
        backgroundColor: bg,
        color,
        alignItems: "center",
        justifyContent: "center",
        fontFamily: SANS,
        fontWeight: 600,
        fontSize: 19,
        letterSpacing: "0.02em",
      }}
    >
      {initials}
    </span>
  );
}

function VisitBar({
  bg,
  color,
  marginTop,
  shadow,
}: {
  bg: string;
  color: string;
  marginTop: number;
  shadow?: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        marginTop,
        height: 96,
        flexShrink: 0,
        borderRadius: 24,
        backgroundColor: bg,
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 40px",
        ...(shadow ? { boxShadow: shadow } : {}),
      }}
    >
      <span style={{ fontFamily: SANS, fontWeight: 600, fontSize: 32, letterSpacing: "0.005em", color }}>
        Visit pleros.org/sogp
      </span>
      <ArrowIcon color={color} />
    </div>
  );
}

function LightCardTemplate({
  share,
  initials,
  logoSrc,
}: {
  share: ShareRenderData;
  initials: string;
  logoSrc: string;
}) {
  const quoteFontSize = getQuoteFontSize(share.quote, 54, 32);
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        boxSizing: "border-box",
        padding: PADDING,
        display: "flex",
        flexDirection: "column",
        backgroundColor: SKY,
        fontFamily: SANS,
      }}
    >
      <CardHeader tone="light" logoSrc={logoSrc} />
      <div style={{ marginTop: 36, display: "flex", flexDirection: "column" }}>
        <Divider color="rgba(10, 26, 110, 0.18)" />
      </div>
      <div style={{ marginTop: 40, display: "flex", flexDirection: "column" }}>
        <DayBadge
          tone="light"
          dayText={getLearningProgressDayText(share)}
          teachingLabel={getLearningProgressTeachingLabel(share)}
          accent={ACCENT_LIGHT}
        />
      </div>
      <Headline tone="light" text={getLearningProgressHeadline(share)} />
      <div
        style={{
          marginTop: 36,
          flexGrow: 1,
          backgroundColor: "#FFFFFF",
          borderRadius: 28,
          padding: 48,
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 18px 44px rgba(10, 26, 110, 0.10)",
        }}
      >
        <WhatILearntRow labelColor={WHAT_I_LEARNT_GREEN} lineColor={ACCENT_LIGHT} />
        <div style={{ flexGrow: 1, display: "flex", alignItems: "center", padding: "26px 0" }}>
          <p
            style={{
              margin: 0,
              fontFamily: SERIF,
              fontWeight: 500,
              fontStyle: "italic",
              fontSize: quoteFontSize,
              lineHeight: 1.28,
              letterSpacing: "-0.015em",
              color: NAVY,
            }}
          >
            &ldquo;{share.quote}&rdquo;
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 18, marginTop: 32 }}>
          <Avatar bg={NAVY} color="#FFFFFF" initials={initials} />
          <span style={{ fontFamily: SANS, fontWeight: 600, fontSize: 24, lineHeight: 1.2, color: NAVY }}>
            {share.authorName}
          </span>
        </div>
      </div>
      <VisitBar bg={NAVY} color="#FFFFFF" marginTop={32} />
    </div>
  );
}

function DarkOpenTemplate({
  share,
  initials,
  logoSrc,
}: {
  share: ShareRenderData;
  initials: string;
  logoSrc: string;
}) {
  const quoteFontSize = getQuoteFontSize(share.quote, 58, 34);
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        boxSizing: "border-box",
        padding: PADDING,
        display: "flex",
        flexDirection: "column",
        backgroundColor: NAVY,
        fontFamily: SANS,
      }}
    >
      <CardHeader tone="dark" logoSrc={logoSrc} />
      <div style={{ marginTop: 36, display: "flex", flexDirection: "column" }}>
        <Divider color="rgba(219, 240, 252, 0.28)" />
      </div>
      <div style={{ marginTop: 40, display: "flex", flexDirection: "column" }}>
        <DayBadge
          tone="dark"
          dayText={getLearningProgressDayText(share)}
          teachingLabel={getLearningProgressTeachingLabel(share)}
          accent={ACCENT_DARK}
        />
      </div>
      <Headline tone="dark" text={getLearningProgressHeadline(share)} />
      <div style={{ marginTop: 40, flexGrow: 1, display: "flex", flexDirection: "column" }}>
        <WhatILearntRow labelColor={ACCENT_DARK} lineColor={ACCENT_DARK} />
        <div style={{ flexGrow: 1, display: "flex", alignItems: "center", padding: "28px 0" }}>
          <p
            style={{
              margin: 0,
              fontFamily: SERIF,
              fontWeight: 500,
              fontStyle: "italic",
              fontSize: quoteFontSize,
              lineHeight: 1.3,
              letterSpacing: "-0.015em",
              color: "#FFFFFF",
            }}
          >
            &ldquo;{share.quote}&rdquo;
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 18, marginTop: 32 }}>
          <Avatar bg={SKY} color={NAVY} initials={initials} />
          <span style={{ fontFamily: SANS, fontWeight: 600, fontSize: 24, lineHeight: 1.2, color: "#FFFFFF" }}>
            {share.authorName}
          </span>
        </div>
      </div>
      <VisitBar bg={SKY} color={NAVY} marginTop={36} />
    </div>
  );
}

function DarkCardTemplate({
  share,
  initials,
  patternSrc,
  logoSrc,
}: {
  share: ShareRenderData;
  initials: string;
  patternSrc: string;
  logoSrc: string;
}) {
  const quoteFontSize = getQuoteFontSize(share.quote, 54, 32);
  return (
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
      <div style={{ marginTop: 40, display: "flex", flexDirection: "column" }}>
        <DayBadge
          tone="dark"
          dayText={getLearningProgressDayText(share)}
          teachingLabel={getLearningProgressTeachingLabel(share)}
          accent={ACCENT_DARK}
        />
      </div>
      <Headline tone="dark" text={getLearningProgressHeadline(share)} />
      <div
        style={{
          marginTop: 36,
          flexGrow: 1,
          backgroundColor: "#FFFFFF",
          borderRadius: 28,
          padding: 48,
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 24px 56px rgba(4, 22, 92, 0.24)",
        }}
      >
        <WhatILearntRow labelColor={WHAT_I_LEARNT_GREEN} lineColor={ACCENT_DARK} />
        <div style={{ flexGrow: 1, display: "flex", alignItems: "center", padding: "26px 0" }}>
          <p
            style={{
              margin: 0,
              fontFamily: SERIF,
              fontWeight: 500,
              fontStyle: "italic",
              fontSize: quoteFontSize,
              lineHeight: 1.28,
              letterSpacing: "-0.015em",
              color: NAVY,
            }}
          >
            &ldquo;{share.quote}&rdquo;
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 18, marginTop: 32 }}>
          <Avatar bg={PATTERN_BLUE} color="#FFFFFF" initials={initials} />
          <span style={{ fontFamily: SANS, fontWeight: 600, fontSize: 24, lineHeight: 1.2, color: NAVY }}>
            {share.authorName}
          </span>
        </div>
      </div>
      <VisitBar
        bg={NAVY}
        color="#FFFFFF"
        marginTop={32}
        shadow="0 16px 36px rgba(4, 22, 92, 0.22)"
      />
    </div>
  );
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
  if (!share || share.kind !== "image" || !share.quote) {
    return NextResponse.json({ error: "Share not found" }, { status: 404 });
  }

  const renderData: ShareRenderData = {
    quote: share.quote,
    authorName: share.authorName,
    track: share.track,
    dayNumber: share.dayNumber,
    lessonTitle: share.lessonTitle,
  };
  const initials = getLearningProgressShareInitials(share.authorName);

  let element: ReactElement;
  if (share.template === "dark-open") {
    const logoSrc = await getWhiteLogoDataUri();
    element = <DarkOpenTemplate share={renderData} initials={initials} logoSrc={logoSrc} />;
  } else if (share.template === "dark-card") {
    const [patternSrc, logoSrc] = await Promise.all([
      getPatternDataUri(),
      getWhiteLogoDataUri(),
    ]);
    element = (
      <DarkCardTemplate
        share={renderData}
        initials={initials}
        patternSrc={patternSrc}
        logoSrc={logoSrc}
      />
    );
  } else {
    const logoSrc = await getDarkLogoDataUri();
    element = <LightCardTemplate share={renderData} initials={initials} logoSrc={logoSrc} />;
  }

  const fonts = await getCardFonts();
  return new ImageResponse(element, { ...SIZE, fonts });
}
