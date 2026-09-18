import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { ImageResponse } from "next/og";
import type { ReactElement } from "react";
import { NextResponse } from "next/server";

import { getAppSession } from "@/lib/app-session";
import { getLearningProgressShareForOwner } from "@/lib/db/queries/sogp-learning-progress-share";
import { getLearningProgressShareInitials } from "@/lib/sogp/learning-progress-share";

export const runtime = "nodejs";

const SIZE = { width: 1080, height: 1080 };
const PADDING = 64;

const NAVY = "#051480";
const SKY = "#d2f1ff";
const ACCENT_ON_LIGHT = "#3f7a17";
const ACCENT_ON_DARK = "#a6e34d";

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

const WORDMARK_WIDTH = 84;
const WORDMARK_HEIGHT = 40;

let whiteWordmarkDataUriPromise: Promise<string> | null = null;
function getWhiteWordmarkDataUri(): Promise<string> {
  if (!whiteWordmarkDataUriPromise) {
    whiteWordmarkDataUriPromise = loadDataUri(
      "public/site/sogp/pleros-wordmark-white.png",
    );
  }
  return whiteWordmarkDataUriPromise;
}

let navyWordmarkDataUriPromise: Promise<string> | null = null;
function getNavyWordmarkDataUri(): Promise<string> {
  if (!navyWordmarkDataUriPromise) {
    navyWordmarkDataUriPromise = loadDataUri(
      "public/site/sogp/pleros-wordmark-navy.png",
    );
  }
  return navyWordmarkDataUriPromise;
}

type ShareRenderData = {
  quote: string;
  authorName: string;
  track: "sogp" | "pre_sogp";
  dayNumber: number | null;
  lessonTitle: string | null;
};

function getEyebrowParts(share: ShareRenderData) {
  const dayText = share.dayNumber
    ? `DAY ${share.dayNumber}`
    : share.track === "pre_sogp"
      ? "PRE-SOGP"
      : "SOGP";
  const detailText = share.lessonTitle
    ? `TEACHING · ${share.lessonTitle.toUpperCase()}`
    : share.track === "pre_sogp"
      ? "PRE-SOGP PREPARATION"
      : "LEARNING PROGRESS";
  return { dayText, detailText };
}

function getHeadline(share: ShareRenderData): string {
  if (share.lessonTitle) return share.lessonTitle;
  return share.track === "pre_sogp"
    ? "My Pre-SOGP Journey"
    : "My SOGP Learning Progress";
}

function getQuoteFontSize(quote: string, base: number, min: number): number {
  const length = quote.length;
  if (length <= 70) return base;
  if (length <= 160) return Math.round(base * 0.85);
  if (length <= 280) return Math.round(base * 0.72);
  if (length <= 420) return Math.round(base * 0.6);
  return min;
}

function CardHeader({
  tone,
  wordmarkSrc,
}: {
  tone: "light" | "dark";
  wordmarkSrc: string;
}) {
  const color = tone === "light" ? NAVY : "#ffffff";
  return (
    <div
      style={{
        display: "flex",
        width: "100%",
        alignItems: "flex-start",
        justifyContent: "space-between",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          fontSize: 30,
          fontWeight: 800,
          lineHeight: 1.2,
          letterSpacing: -0.5,
          color,
        }}
      >
        <span>SCHOOL OF</span>
        <span>GOD&rsquo;S PURPOSE</span>
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element -- satori (ImageResponse) requires a plain <img>, not next/image */}
      <img
        src={wordmarkSrc}
        width={WORDMARK_WIDTH}
        height={WORDMARK_HEIGHT}
        alt=""
      />
    </div>
  );
}

function Divider({ tone }: { tone: "light" | "dark" }) {
  return (
    <div
      style={{
        display: "flex",
        width: "100%",
        height: 1,
        marginTop: 28,
        marginBottom: 28,
        backgroundColor:
          tone === "light" ? "rgba(5,20,128,0.15)" : "rgba(255,255,255,0.25)",
      }}
    />
  );
}

function WhatILearntLabel({ tone }: { tone: "light" | "dark" }) {
  return (
    <div style={{ display: "flex", width: "100%", alignItems: "center", gap: 16 }}>
      <span
        style={{
          fontSize: 17,
          fontWeight: 800,
          letterSpacing: 2,
          textTransform: "uppercase",
          color: tone === "light" ? ACCENT_ON_LIGHT : ACCENT_ON_DARK,
        }}
      >
        What I learnt
      </span>
      <div
        style={{
          display: "flex",
          flexGrow: 1,
          height: 1,
          backgroundColor: tone === "light" ? "#e2e2e2" : "rgba(255,255,255,0.3)",
        }}
      />
    </div>
  );
}

function VisitBar({ tone }: { tone: "onDark" | "onLight" }) {
  const bg = tone === "onDark" ? NAVY : "#ffffff";
  const fg = tone === "onDark" ? "#ffffff" : NAVY;
  return (
    <div
      style={{
        display: "flex",
        marginTop: 28,
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: bg,
        borderRadius: 999,
        padding: "20px 34px",
      }}
    >
      <span style={{ color: fg, fontSize: 24, fontWeight: 800 }}>
        Visit pleros.org/sogp
      </span>
      <span style={{ color: fg, fontSize: 26, fontWeight: 800 }}>→</span>
    </div>
  );
}

function LightCardTemplate({
  share,
  initials,
  wordmarkSrc,
}: {
  share: ShareRenderData;
  initials: string;
  wordmarkSrc: string;
}) {
  const { dayText, detailText } = getEyebrowParts(share);
  const quoteFontSize = getQuoteFontSize(share.quote, 44, 28);
  return (
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        backgroundColor: SKY,
        padding: PADDING,
        fontFamily: "sans-serif",
      }}
    >
      <CardHeader tone="light" wordmarkSrc={wordmarkSrc} />
      <Divider tone="light" />
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div
          style={{
            display: "flex",
            backgroundColor: NAVY,
            color: "#ffffff",
            fontSize: 19,
            fontWeight: 800,
            padding: "10px 22px",
            borderRadius: 999,
          }}
        >
          {dayText}
        </div>
        <span
          style={{
            fontSize: 17,
            fontWeight: 700,
            letterSpacing: 1,
            color: ACCENT_ON_LIGHT,
          }}
        >
          {detailText}
        </span>
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flexGrow: 1,
          marginTop: 28,
          backgroundColor: "#ffffff",
          borderRadius: 28,
          padding: 48,
          justifyContent: "space-between",
          overflow: "hidden",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <WhatILearntLabel tone="light" />
          <span
            style={{
              marginTop: 26,
              fontSize: quoteFontSize,
              fontStyle: "italic",
              fontWeight: 600,
              color: NAVY,
              lineHeight: 1.4,
            }}
          >
            {share.quote}
          </span>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 18,
            paddingTop: 28,
            borderTop: "1px solid #eeeeee",
          }}
        >
          <div
            style={{
              display: "flex",
              width: 58,
              height: 58,
              borderRadius: 999,
              backgroundColor: NAVY,
              color: "#ffffff",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 22,
              fontWeight: 800,
            }}
          >
            {initials}
          </div>
          <span style={{ fontSize: 23, fontWeight: 800, color: NAVY }}>
            {share.authorName}
          </span>
        </div>
      </div>
      <VisitBar tone="onDark" />
    </div>
  );
}

function DarkOpenTemplate({
  share,
  patternSrc,
  wordmarkSrc,
}: {
  share: ShareRenderData;
  patternSrc: string;
  wordmarkSrc: string;
}) {
  const { dayText, detailText } = getEyebrowParts(share);
  const quoteFontSize = getQuoteFontSize(share.quote, 50, 30);
  return (
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        backgroundImage: `url(${patternSrc})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        padding: PADDING,
        fontFamily: "sans-serif",
      }}
    >
      <CardHeader tone="dark" wordmarkSrc={wordmarkSrc} />
      <Divider tone="dark" />
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div
          style={{
            display: "flex",
            border: "2px solid rgba(255,255,255,0.6)",
            borderRadius: 999,
            padding: "9px 20px",
          }}
        >
          <span style={{ fontSize: 19, fontWeight: 800, color: "#ffffff" }}>
            {dayText}
          </span>
        </div>
        <span
          style={{
            fontSize: 17,
            fontWeight: 700,
            letterSpacing: 1,
            color: "rgba(255,255,255,0.85)",
          }}
        >
          {detailText}
        </span>
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flexGrow: 1,
          marginTop: 40,
          justifyContent: "space-between",
          overflow: "hidden",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <WhatILearntLabel tone="dark" />
          <span
            style={{
              marginTop: 30,
              fontSize: quoteFontSize,
              fontWeight: 500,
              color: "#ffffff",
              lineHeight: 1.35,
            }}
          >
            {share.quote}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ fontSize: 30, fontWeight: 800, color: ACCENT_ON_DARK }}>
            —
          </span>
          <span style={{ fontSize: 25, fontWeight: 800, color: "#ffffff" }}>
            {share.authorName}
          </span>
        </div>
      </div>
      <VisitBar tone="onLight" />
    </div>
  );
}

function DarkCardTemplate({
  share,
  initials,
  patternSrc,
  wordmarkSrc,
}: {
  share: ShareRenderData;
  initials: string;
  patternSrc: string;
  wordmarkSrc: string;
}) {
  const { dayText, detailText } = getEyebrowParts(share);
  const headline = getHeadline(share);
  const quoteFontSize = getQuoteFontSize(share.quote, 38, 24);
  return (
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        backgroundImage: `url(${patternSrc})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        padding: PADDING,
        fontFamily: "sans-serif",
      }}
    >
      <CardHeader tone="dark" wordmarkSrc={wordmarkSrc} />
      <Divider tone="dark" />
      <div
        style={{
          display: "flex",
          backgroundColor: "#ffffff",
          color: NAVY,
          fontSize: 19,
          fontWeight: 800,
          padding: "10px 22px",
          borderRadius: 999,
        }}
      >
        {share.lessonTitle ? `${dayText} • TEACHING` : `${dayText} • ${detailText}`}
      </div>
      <span
        style={{
          marginTop: 26,
          fontSize: 46,
          fontWeight: 700,
          color: "#ffffff",
          lineHeight: 1.15,
        }}
      >
        {headline}
      </span>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flexGrow: 1,
          marginTop: 32,
          backgroundColor: "#ffffff",
          borderRadius: 28,
          padding: 44,
          justifyContent: "space-between",
          overflow: "hidden",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <WhatILearntLabel tone="light" />
          <span
            style={{
              marginTop: 24,
              fontSize: quoteFontSize,
              fontStyle: "italic",
              fontWeight: 600,
              color: NAVY,
              lineHeight: 1.4,
            }}
          >
            {share.quote}
          </span>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 18,
            paddingTop: 24,
            borderTop: "1px solid #eeeeee",
          }}
        >
          <div
            style={{
              display: "flex",
              width: 54,
              height: 54,
              borderRadius: 999,
              backgroundColor: NAVY,
              color: "#ffffff",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 20,
              fontWeight: 800,
            }}
          >
            {initials}
          </div>
          <span style={{ fontSize: 22, fontWeight: 800, color: NAVY }}>
            {share.authorName}
          </span>
        </div>
      </div>
      <VisitBar tone="onDark" />
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
  if (!share) {
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
    const [patternSrc, wordmarkSrc] = await Promise.all([
      getPatternDataUri(),
      getWhiteWordmarkDataUri(),
    ]);
    element = (
      <DarkOpenTemplate share={renderData} patternSrc={patternSrc} wordmarkSrc={wordmarkSrc} />
    );
  } else if (share.template === "dark-card") {
    const [patternSrc, wordmarkSrc] = await Promise.all([
      getPatternDataUri(),
      getWhiteWordmarkDataUri(),
    ]);
    element = (
      <DarkCardTemplate
        share={renderData}
        initials={initials}
        patternSrc={patternSrc}
        wordmarkSrc={wordmarkSrc}
      />
    );
  } else {
    const wordmarkSrc = await getNavyWordmarkDataUri();
    element = (
      <LightCardTemplate share={renderData} initials={initials} wordmarkSrc={wordmarkSrc} />
    );
  }

  return new ImageResponse(element, { ...SIZE });
}
