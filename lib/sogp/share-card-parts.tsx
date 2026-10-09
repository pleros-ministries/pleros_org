import {
  LEARNING_PROGRESS_SHARE_NAVY as NAVY,
  LEARNING_PROGRESS_SHARE_SANS as SANS,
} from "./learning-progress-share";

/** Satori (`ImageResponse`) building blocks shared by the SOGP share cards. */

export function ArrowIcon({ color }: { color: string }) {
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

export function CardHeader({ tone, logoSrc }: { tone: "light" | "dark"; logoSrc: string }) {
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

export function Divider({ color }: { color: string }) {
  return <div style={{ display: "flex", width: "100%", height: 1, background: color }} />;
}

export function Avatar({ bg, color, initials }: { bg: string; color: string; initials: string }) {
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

export function VisitBar({
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
